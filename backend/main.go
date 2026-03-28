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

	db := database.Connect(os.Getenv("DB_NAME"))

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

	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:4200")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := router.Group("/api")

	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/logout", authHandler.Logout)
	}

	protected := api.Group("/").Use(authMiddleware)
	{
		protected.GET("/users/:id", userHandler.GetUserById)
		protected.GET("/users/me", userHandler.GetCurrentUser)
		protected.DELETE("/users/me", userHandler.DeleteUser)
		// TODO: Add a PATCH endpoint for updating user profile info
		// NOTE: settings will be updated w/ app preferences (TBD)
		protected.GET("/settings", settingsHandler.GetSettings)
		protected.PUT("/settings", settingsHandler.UpdateSettings)
	}

	listingHandler := handlers.NewListingHandler(db)

	api.GET("/listings", listingHandler.GetListings)
	api.POST("/listings", listingHandler.CreateListing)

	router.Run("localhost:8080")
}
