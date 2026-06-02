package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/ttomsin/paye/internal/db"
)

// entry point for the API

func main() {
	// load env, using dotenv
	err := godotenv.Load()
	if err != nil {
		log.Fatal(err)
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

	// Gin config
	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello, World!",
		})
	})
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	if err := r.Run(":8080"); err != nil {
		log.Fatal("failed to start server: ", err)
	}
}
