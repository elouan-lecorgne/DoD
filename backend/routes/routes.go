package routes

import (
	"dod-backend/config"
	"dod-backend/controllers"
	"dod-backend/middleware"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	cfg := config.Load()
	ctrl := controllers.NewController(db, cfg)

	// Middleware
	r.Use(middleware.CORSMiddleware())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := r.Group("/api/v1")
	{
		// Auth routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", ctrl.Register)
			auth.POST("/login", ctrl.Login)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			// Projects
			projects := protected.Group("/projects")
			{
				projects.POST("/", ctrl.CreateProject)
				projects.GET("/", ctrl.GetUserProjects)
				projects.POST("/:id/participants", ctrl.AddProjectParticipant)
				projects.GET("/:id/dods", ctrl.GetProjectDoDs)
			}

			// DoDs
			dods := protected.Group("/dods")
			{
				dods.POST("/", ctrl.CreateDoD)
				dods.POST("/:id/items", ctrl.AddDoDItem)
			}
		}
	}
}