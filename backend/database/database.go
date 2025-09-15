package database

import (
	"fmt"
	"log"

	"dod-backend/config"
	"dod-backend/models"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
)

func Initialize(cfg *config.Config) *gorm.DB {
	dsn := fmt.Sprintf("host=%s port=%s user=%s dbname=%s password=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBName, cfg.DBPassword)

	db, err := gorm.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected successfully")

	// Auto migrate les modèles
	err = db.AutoMigrate(
		&models.User{},
		&models.Project{},
		&models.DoD{},
		&models.DoDItem{},
		&models.ProjectParticipant{},
	).Error

	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database migration completed")
	return db
}

func Close(db *gorm.DB) {
	if err := db.Close(); err != nil {
		log.Printf("Error closing database: %v", err)
	}
}