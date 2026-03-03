package main

import (
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/Jcorrieri/uf-marketplace/backend/database"
	"github.com/Jcorrieri/uf-marketplace/backend/handlers"
	"github.com/Jcorrieri/uf-marketplace/backend/middleware"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Error loading .env file")
	}

	db := database.Connect()

	sessionName := os.Getenv("SESSION_COOKIE_NAME")
	if sessionName == "" {
		sessionName = "session_token"
	}

	authService := services.NewAuthService(db)
	userService := services.NewUserService(db)

	userHandler := handlers.NewUserHandler(userService)
	authHandler := handlers.NewAuthHandler(authService, userService, sessionName)
	settingsHandler := handlers.NewSettingsHandler(userService)

	authMiddleware := middleware.AuthMiddleware(os.Getenv("JWT_SECRET"), sessionName)

	router := gin.Default()

	api := router.Group("/api")

	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/logout", authHandler.Logout)
	}

	protected := api.Group("/").Use(authMiddleware)
	{
		protected.GET("/profile", userHandler.GetUserById)
		protected.DELETE("/profile", userHandler.DeleteUser)
		// NOTE: settings will be updated w/ app preferences (TBD)
		protected.GET("/settings", settingsHandler.GetSettings)
		protected.PUT("/settings", settingsHandler.UpdateSettings)
	}

	router.Run("localhost:8080")
}
