package main

import (
	"os"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"

	"github.com/Jcorrieri/uf-marketplace/backend/database"
	"github.com/Jcorrieri/uf-marketplace/backend/handlers"
)

func main() {
	// Instantiate database
	db := database.Connect()

	// Get session cookie name from environment
	sessionName := os.Getenv("SESSION_COOKIE_NAME")
	if sessionName == "" {
		sessionName = "session_token"
	}

	// Get services
	authService := services.NewAuthService(db)
	userService := services.NewUserService(db)

	userHandler := handlers.NewUserHandler(userService)
	authHandler := handlers.NewAuthHandler(authService, userService, sessionName)
	settingsHandler := handlers.NewSettingsHandler(userService)

	// Create router
	router := gin.Default()

	// Grouping for cleaner logic
	api := router.Group("/api")

	// Auth routes (public)
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/logout", authHandler.Logout)
	}

	protected := api.Group("/").Use(middleware.AuthMiddleware())
	{
		protected.GET("/profile", userHandler.GetUserById)
		protected.DELETE("/profile", userHandler.DeleteUser)
		// NOTE: settings will be updated w/ app preferences (TBD)
		protected.GET("/settings", settingsHandler.GetSettings)
		protected.PUT("/settings", settingsHandler.UpdateSettings)
	}

	router.Run("localhost:8080")
}
