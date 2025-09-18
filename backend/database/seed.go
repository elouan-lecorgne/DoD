package database

import (
	"log"

	"dod-backend/models"

	"github.com/jinzhu/gorm"
	"golang.org/x/crypto/bcrypt"
)

func SeedDatabase(db *gorm.DB) {
	log.Println("Starting database seeding...")

	// Create test users
	users := []models.User{
		{
			Username: "alice",
			Email:    "alice@example.com",
			Password: hashPassword("password123"),
		},
		{
			Username: "bob",
			Email:    "bob@example.com",
			Password: hashPassword("password123"),
		},
		{
			Username: "charlie",
			Email:    "charlie@example.com",
			Password: hashPassword("password123"),
		},
	}

	for _, user := range users {
		var existingUser models.User
		if db.Where("email = ?", user.Email).First(&existingUser).RecordNotFound() {
			db.Create(&user)
			log.Printf("Created user: %s", user.Username)
		}
	}

	// Get first user for project creation
	var alice models.User
	db.Where("email = ?", "alice@example.com").First(&alice)

	// Create test project
	project := models.Project{
		Name:        "Sample E-commerce Project",
		Description: "A sample project for demonstrating DoD functionality",
		OwnerID:     alice.ID,
	}

	var existingProject models.Project
	if db.Where("name = ?", project.Name).First(&existingProject).RecordNotFound() {
		db.Create(&project)
		log.Printf("Created project: %s", project.Name)

		// Add owner as participant
		participant := models.ProjectParticipant{
			ProjectID: project.ID,
			UserID:    alice.ID,
			Role:      "owner",
		}
		db.Create(&participant)

		// Create sample DoD
		dod := models.DoD{
			Title:       "Feature Development DoD",
			Description: "Definition of Done for feature development tasks",
			ProjectID:   project.ID,
			CreatedBy:   alice.ID,
			IsActive:    true,
		}
		db.Create(&dod)
		log.Printf("Created DoD: %s", dod.Title)

		// Add DoD items
		dodItems := []models.DoDItem{
			{
				DoDID:       dod.ID,
				Title:       "Code Review Completed",
				Description: "All code has been reviewed by at least one other developer",
				IsRequired:  true,
				Order:       1,
			},
			{
				DoDID:       dod.ID,
				Title:       "Unit Tests Written",
				Description: "Unit tests cover at least 80% of the new code",
				IsRequired:  true,
				Order:       2,
			},
			{
				DoDID:       dod.ID,
				Title:       "Integration Tests Pass",
				Description: "All existing integration tests pass with new changes",
				IsRequired:  true,
				Order:       3,
			},
			{
				DoDID:       dod.ID,
				Title:       "Documentation Updated",
				Description: "Technical documentation has been updated to reflect changes",
				IsRequired:  false,
				Order:       4,
			},
			{
				DoDID:       dod.ID,
				Title:       "Performance Testing",
				Description: "Performance impact has been evaluated",
				IsRequired:  false,
				Order:       5,
			},
		}

		for _, item := range dodItems {
			db.Create(&item)
		}
		log.Printf("Created %d DoD items", len(dodItems))
	}

	log.Println("Database seeding completed!")
}

func hashPassword(password string) string {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}
	return string(hashedPassword)
}