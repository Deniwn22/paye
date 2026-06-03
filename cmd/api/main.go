package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/ttomsin/paye/internal/db"
	"github.com/ttomsin/paye/internal/features/auth"
	"github.com/ttomsin/paye/internal/features/user"
)

// entry point for the API

func main() {
	// load env, using dotenv
	err := godotenv.Load()
	if err != nil {
		log.Fatal(err)
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is not set")
	}

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

	// init services
	authService := auth.NewAuthService(userRepo, jwtSecret)

	//init handlers
	authHandler := auth.NewAuthHandler(*authService)

	// Gin config
	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello, World!",
		})
	})
	v1 := r.Group("/api/v1")
	// health check
	v1.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})
	auth.RegisterRoutes(v1, authHandler)

	if err := r.Run(":8080"); err != nil {
		log.Fatal("failed to start server: ", err)
	}
}
