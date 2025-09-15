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
	// Charger les variables d'environnement
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialiser la configuration
	cfg := config.Load()

	// Initialiser la base de données
	db := database.Initialize(cfg)
	defer database.Close(db)

	// Seed database if requested
	if len(os.Args) > 1 && os.Args[1] == "seed" {
		database.SeedDatabase(db)
		return
	}

	// Configurer Gin
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Créer le routeur
	r := gin.Default()

	// Configurer les routes
	routes.SetupRoutes(r, db)

	// Démarrer le serveur
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}