package main

import (
	"log"
	"os"

	"dod-backend/config"
	"dod-backend/database"
	"dod-backend/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	cfg := config.Load()

	db := database.Initialize(cfg)
	defer database.Close(db)

	if len(os.Args) > 1 && os.Args[1] == "seed" {
		database.SeedDatabase(db)
		return
	}

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	routes.SetupRoutes(r, db)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}