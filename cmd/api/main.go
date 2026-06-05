package main

import (
	"crypto/sha256"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	_ "github.com/ttomsin/paye/docs" // generated docs
	"github.com/ttomsin/paye/internal/db"
	"github.com/ttomsin/paye/internal/features/auth"
	"github.com/ttomsin/paye/internal/features/dashboard"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/transactions"
	"github.com/ttomsin/paye/internal/features/projects"
	"github.com/ttomsin/paye/internal/features/sdk"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/features/webhooks"
	"github.com/ttomsin/paye/internal/middleware"
)

// @title Paye API
// @version 1.0
// @description Unified payment infrastructure API.
// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer <your-jwt-token>" to authenticate.

func main() {
	// load env, using dotenv
	err := godotenv.Load()
	if err != nil {
		log.Println("Note: .env file not found, using environment variables")
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is not set")
	}

	encKey := os.Getenv("ENCRYPTION_KEY")
	if encKey == "" {
		log.Println("WARNING: ENCRYPTION_KEY is not set. Falling back to JWT_SECRET for derivation.")
		encKey = jwtSecret
	}
	// Derive a 32-byte encryption key using SHA-256 to prevent AES block size errors
	hash := sha256.Sum256([]byte(encKey))
	derivedEncryptionKey := string(hash[:])

	// load database url
	db_url := os.Getenv("DATABASE_URL")
	if db_url == "" {
		log.Fatal("DATABASE_URL is not set")
	}
	database, err := db.Connect(db_url)
	if err != nil {
		log.Fatal("failed to connect to database: ", err)
	}
	if err = db.Migrate(database); err != nil {
		log.Fatal("failed to migrate database: ", err)
	}

	log.Println("database connected and migrated successfully")

	// init repos
	userRepo := user.NewUserRepo(database.DB)
	projectRepo := projects.NewProjectRepo(database.DB)
	providerRepo := providers.NewProviderRepo(database.DB)
	webhookRepo := webhooks.NewWebhookRepo(database.DB)
	dashboardRepo := dashboard.NewDashboardRepo(database.DB)
	transactionRepo := transactions.NewTransactionRepo(database.DB)

	// init services
	authService := auth.NewAuthService(userRepo, projectRepo, jwtSecret)
	projectService := projects.NewProjectService(projectRepo)
	providerService := providers.NewProviderService(providerRepo, derivedEncryptionKey)
	webhookService := webhooks.NewWebhookService(webhookRepo, providerRepo, userRepo, derivedEncryptionKey)
	dashboardService := dashboard.NewDashboardService(dashboardRepo)
	transactionService := transactions.NewTransactionService(transactionRepo, providerRepo, derivedEncryptionKey)

	//init handlers
	authHandler := auth.NewAuthHandler(*authService)
	projectHandler := projects.NewProjectHandler(projectService)
	providerHandler := providers.NewProviderHandler(providerService)
	webhookHandler := webhooks.NewWebhookHandler(webhookService)
	dashboardHandler := dashboard.NewDashboardHandler(dashboardService)
	transactionHandler := transactions.NewTransactionHandler(transactionService)
	sdkHandler := sdk.NewSDKHandler(userRepo, projectRepo, providerRepo, transactionService, derivedEncryptionKey)

	// Gin config
	r := gin.Default()
	r.Use(cors.Default())
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello, World!",
		})
	})
	
	// Register Swagger public endpoint
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Register Dynamic SDK serving route (Public)
	r.GET("/sdk/:publicId", sdkHandler.ServeSDK)
	
	// Public Group
	v1 := r.Group("/api/v1")
	// health check
	v1.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})
	
	// Auth Routes (Public)
	auth.RegisterRoutes(v1, authHandler)

	// Public SDK Initialize Endpoint (Public)
	v1.POST("/sdk/transactions/initialize", sdkHandler.InitializeSDKTransaction)

	// Protected Group (Requires JWT token)
	jwtMiddleware := middleware.NewApiJwtMiddleware(jwtSecret)
	projectScopeMiddleware := middleware.NewProjectScopeMiddleware(database.DB)
	protected := v1.Group("")
	protected.Use(jwtMiddleware.Handle, projectScopeMiddleware.Handle)

	// Register Project routes (Protected)
	projects.RegisterRoutes(protected, projectHandler)

	// Register Provider Config routes (Protected)
	providers.RegisterRoutes(protected, providerHandler)

	// Register Webhook Config and Webhook receive routes
	// Note: RegisterRoutes configures both protected CRUD routes and the public proxy route
	webhooks.RegisterRoutes(protected, v1, webhookHandler)

	// Register Dashboard stats and logs routes (Protected)
	dashboard.RegisterRoutes(protected, dashboardHandler)

	// Register Transaction list route (Protected by JWT)
	protected.GET("/transactions", transactionHandler.ListTransactionsHandler)

	// Protected Group (Requires API Key)
	apiKeyMiddleware := middleware.NewApiKeyMiddleware(authService)
	apiKeyProtected := v1.Group("")
	apiKeyProtected.Use(apiKeyMiddleware.Handle)

	// Register Transaction routes (Protected by API Key)
	transactions.RegisterRoutes(apiKeyProtected, transactionHandler)

	if err := r.Run(":8080"); err != nil {
		log.Fatal("failed to start server: ", err)
	}
}
