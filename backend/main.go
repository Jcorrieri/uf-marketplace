package main

import (
	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"

	"github.com/Jcorrieri/uf-marketplace/backend/database"
	"github.com/Jcorrieri/uf-marketplace/backend/handlers"
)

func main() {
	// Instantiate database
	db := database.Connect()

	// Get services
	authService := services.NewAuthService(db)
	userService := services.NewUserService(db)	

	// Set handlers
	userHandler := handlers.NewUserHandler(userService)
	authHandler := handlers.NewAuthHandler(authService, userService)
	settingsHandler := handlers.NewSettingsHandler(userService)

	// Create router
	router := gin.Default()

	// Grouping for cleaner logic
	api := router.Group("/api")
	{
		// Auth routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			// auth.POST("/login", handlers.Login)
		}

		users := api.Group("/users")
		{
			users.GET("", userHandler.GetUsers)
			users.GET("/:id", userHandler.GetUserById)
			// users.POST("", userHandler.AddUser)
			users.DELETE("/:id", userHandler.DeleteUser)
		}

		settings := api.Group("/settings")
		{
			settings.GET("", settingsHandler.GetSettings)
			settings.PUT("", settingsHandler.UpdateSettings)

		}

	}

	router.Run("localhost:8080")
}
