package main

import (
	"context"
	"crypto/sha256"
	"log/slog"
	"os"
	"time"

	"github.com/robfig/cron/v3"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/ttomsin/paye/docs" // generated docs
	"github.com/ttomsin/paye/internal/db"
	"github.com/ttomsin/paye/internal/features/auth"
	"github.com/ttomsin/paye/internal/features/dashboard"
	"github.com/ttomsin/paye/internal/features/notifications"
	"github.com/ttomsin/paye/internal/features/paystack"
	"github.com/ttomsin/paye/internal/features/projects"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/sdk"
	"github.com/ttomsin/paye/internal/features/subscriptions"
	"github.com/ttomsin/paye/internal/features/transactions"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/features/virtual_accounts"
	"github.com/ttomsin/paye/internal/features/webhooks"
	"github.com/ttomsin/paye/internal/middleware"
)

// @title Paye API
// @version 1.0
// @description Unified payment routing engine and secure webhook proxies for African developers.
// @description
// @description Production Server: https://paye.africa
// @description Local Server: http://localhost:8080
// @description
// @description ---
// @description **Testing Guide:**
// @description - **Safe to Test**: Endpoints under the Dashboard and Providers tags are safe to use for CRUD operations. Virtual accounts can be created with `type: static` safely.
// @description - **Use Caution**: Live Transaction initializations will redirect to actual payment gateways and may deduct funds if real card details are entered. Ensure you are using Test API Keys (`X-Paye-API-Key: paye_test_...`) when exploring transaction flows.
// @description - **Misdirected Payments**: These are auto-generated when webhooks fail to find a matching VA. You can list them and mark them as resolved safely.
// @description ---
// @description
// @description Authentication Modes:
// @description 1. Bearer JWT Token: Passed as "Authorization: Bearer <token>". Scoped to Dashboard CRUD resources (projects, provider credentials, webhook routes, logs).
// @description 2. API Key Header: Passed as "X-Paye-API-Key: paye_live_..." or "paye_test_...". Scoped to server-to-server transaction initializations, refunds, and payouts.
// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer <your-jwt-token>" to authenticate.

// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name X-Paye-API-Key
// @description The merchant's API Key (e.g., paye_live_... or paye_test_...).

func main() {
	// Configure structured logger
	var logHandler slog.Handler
	if os.Getenv("LOG_FORMAT") == "json" || os.Getenv("GIN_MODE") == "release" {
		logHandler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})
	} else {
		logHandler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})
	}
	slog.SetDefault(slog.New(logHandler))

	// load env, using dotenv
	err := godotenv.Load()
	if err != nil {
		slog.Info("Note: .env file not found, using environment variables")
	}

	if os.Getenv("GIN_MODE") == "release" {
		docs.SwaggerInfo.Host = "paye.africa"
		docs.SwaggerInfo.Schemes = []string{"https"}
	} else {
		docs.SwaggerInfo.Host = "localhost:8080"
		docs.SwaggerInfo.Schemes = []string{"http"}
	}
	if host := os.Getenv("SWAGGER_HOST"); host != "" {
		docs.SwaggerInfo.Host = host
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		slog.Error("JWT_SECRET is not set")
		os.Exit(1)
	}

	encKey := os.Getenv("ENCRYPTION_KEY")
	if encKey == "" {
		slog.Warn("WARNING: ENCRYPTION_KEY is not set. Falling back to JWT_SECRET for derivation.")
		encKey = jwtSecret
	}
	// Derive a 32-byte encryption key using SHA-256 to prevent AES block size errors
	hash := sha256.Sum256([]byte(encKey))
	derivedEncryptionKey := string(hash[:])

	// load database url
	db_url := os.Getenv("DATABASE_URL")
	if db_url == "" {
		slog.Error("DATABASE_URL is not set")
		os.Exit(1)
	}

	var database *db.DB
	var dbErr error
	for i := 0; i < 10; i++ {
		database, dbErr = db.Connect(db_url)
		if dbErr == nil {
			break
		}
		slog.Warn("Failed to connect to database", "attempt", i+1, "error", dbErr)
		time.Sleep(2 * time.Second)
	}
	if dbErr != nil {
		slog.Error("failed to connect to database", "error", dbErr)
		os.Exit(1)
	}
	if err = db.Migrate(database); err != nil {
		slog.Error("failed to migrate database", "error", err)
		os.Exit(1)
	}

	slog.Info("database connected and migrated successfully")

	// init repos
	userRepo := user.NewUserRepo(database.DB)
	projectRepo := projects.NewProjectRepo(database.DB)
	providerRepo := providers.NewProviderRepo(database.DB)
	webhookRepo := webhooks.NewWebhookRepo(database.DB)
	dashboardRepo := dashboard.NewDashboardRepo(database.DB)
	transactionRepo := transactions.NewTransactionRepo(database.DB)
	paystackRepo := paystack.NewPaystackRepository(database.DB)

	// init notifications
	notificationRepo := notifications.NewNotificationRepo(database.DB)
	notificationBroker := notifications.NewNotificationBroker()
	notificationService := notifications.NewNotificationService(notificationRepo, notificationBroker)

	// init virtual accounts
	vaRepo := virtual_accounts.NewVARepository(database.DB)

	// init services
	authService := auth.NewAuthService(userRepo, projectRepo, jwtSecret)
	projectService := projects.NewProjectService(projectRepo)
	paystackService := paystack.NewPaystackService(paystackRepo, providerRepo, derivedEncryptionKey)
	providerService := providers.NewProviderService(providerRepo, derivedEncryptionKey, database.DB)
	providerService.SetPaystackService(paystackService)
	webhookService := webhooks.NewWebhookService(webhookRepo, vaRepo, providerRepo, userRepo, derivedEncryptionKey, notificationService)
	dashboardService := dashboard.NewDashboardService(dashboardRepo)
	transactionService := transactions.NewTransactionService(transactionRepo, providerRepo, webhookRepo, derivedEncryptionKey, notificationService)
	subscriptionService := subscriptions.NewSubscriptionService(database.DB, providerRepo, derivedEncryptionKey)
	vaService := virtual_accounts.NewVAService(vaRepo, providerRepo, derivedEncryptionKey)

	// Background worker for processing due subscriptions
	c := cron.New()
	_, err = c.AddFunc("@hourly", func() {
		slog.Info("Running cron job: ProcessDueSubscriptions")
		err := subscriptionService.ProcessDueSubscriptions(context.Background())
		if err != nil {
			slog.Error("Cron error (ProcessDueSubscriptions)", "error", err)
		}
	})
	if err != nil {
		slog.Error("failed to add cron job", "error", err)
		os.Exit(1)
	}

	// Background job to verify older pending transactions that didn't get webhook updates
	_, err = c.AddFunc("*/5 * * * *", func() {
		slog.Info("Running cron job: PollPendingTransactions")
		err := transactionService.PollPendingTransactions(context.Background())
		if err != nil {
			slog.Error("Cron error (PollPendingTransactions)", "error", err)
		}
	})
	if err != nil {
		slog.Error("failed to add transactions polling cron job", "error", err)
		os.Exit(1)
	}

	c.Start()

	//init handlers
	authHandler := auth.NewAuthHandler(*authService)
	projectHandler := projects.NewProjectHandler(projectService)
	providerHandler := providers.NewProviderHandler(providerService)
	notificationHandler := notifications.NewNotificationHandler(notificationService)
	webhookHandler := webhooks.NewWebhookHandler(webhookService)
	dashboardHandler := dashboard.NewDashboardHandler(dashboardService)
	transactionHandler := transactions.NewTransactionHandler(transactionService)
	sdkHandler := sdk.NewSDKHandler(userRepo, projectRepo, providerRepo, transactionService, derivedEncryptionKey, database.DB, subscriptionService)
	vaHandler := virtual_accounts.NewVAHandler(vaService)

	// Dynamic Swagger Host Configuration
	if os.Getenv("GIN_MODE") == "release" {
		docs.SwaggerInfo.Host = "paye.africa"
		docs.SwaggerInfo.Schemes = []string{"https"}
	} else {
		docs.SwaggerInfo.Host = "localhost:8080"
		docs.SwaggerInfo.Schemes = []string{"http"}
	}

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

	// Serve static files in testweb directory for development/testing
	r.Static("/testweb", "./testweb")

	// Public Group
	v1 := r.Group("/api/v1")
	// health check
	v1.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// user count (for public landing page stats)
	v1.GET("/users/count", func(c *gin.Context) {
		count, err := userRepo.CountUsers(c.Request.Context())
		if err != nil {
			c.JSON(500, gin.H{"status": false, "message": "Failed to retrieve user count"})
			return
		}
		c.JSON(200, gin.H{
			"status": true,
			"data": gin.H{
				"count": count,
			},
		})
	})

	// Auth Routes (Public)
	auth.RegisterRoutes(v1, authHandler)

	// Payment Providers Route (Public)
	v1.GET("/payment-providers", providerHandler.ListPaymentProvidersHandler)

	// Public SDK Initialize Endpoint (Public)
	v1.POST("/sdk/transactions/initialize", sdkHandler.InitializeSDKTransaction)
	v1.POST("/sdk/subscriptions/create", sdkHandler.CreateSDKSubscription)
	v1.GET("/sdk/transactions/verify/:reference", sdkHandler.VerifySDKTransaction)

	// Protected Group (Requires JWT token)
	jwtMiddleware := middleware.NewApiJwtMiddleware(jwtSecret)
	projectScopeMiddleware := middleware.NewProjectScopeMiddleware(database.DB)
	protected := v1.Group("")
	protected.Use(jwtMiddleware.Handle, projectScopeMiddleware.Handle)

	// Register Project routes (Protected)
	projects.RegisterRoutes(protected, projectHandler)

	// Register Provider Config routes (Protected)
	providers.RegisterRoutes(protected, providerHandler)

	// Register Notifications routes (Protected)
	notifications.RegisterRoutes(protected, notificationHandler)

	// Admin Protected Group (Requires JWT token and Admin role)
	adminProtected := v1.Group("")
	adminProtected.Use(jwtMiddleware.Handle, middleware.RequireAdmin())
	providers.RegisterAdminRoutes(adminProtected, providerHandler)

	// Register Webhook Config and Webhook receive routes
	// Note: RegisterRoutes configures both protected CRUD routes and the public proxy route
	webhooks.RegisterRoutes(protected, v1, webhookHandler)

	// Proxy webhook receive route at the root level (supports legacy tests and config URLs without api/v1 prefix)
	r.POST("/webhooks/receive/:slug", webhookHandler.ReceiveWebhookHandler)

	// Register Dashboard stats and logs routes (Protected)
	dashboard.RegisterRoutes(protected, dashboardHandler)

	// Register Transaction list route (Protected by JWT)
	protected.GET("/transactions", transactionHandler.ListTransactionsHandler)

	// Protected Group (Requires API Key)
	apiKeyMiddleware := middleware.NewApiKeyMiddleware(authService)
	apiKeyProtected := v1.Group("")
	apiKeyProtected.Use(apiKeyMiddleware.Handle)

	// Register Transaction & Virtual Account routes (Protected by API Key)
	transactions.RegisterRoutes(apiKeyProtected, transactionHandler)
	virtual_accounts.RegisterRoutes(apiKeyProtected, vaHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := r.Run(":" + port); err != nil {
		slog.Error("failed to start server", "error", err)
		os.Exit(1)
	}
}
