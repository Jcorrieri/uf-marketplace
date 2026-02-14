package main

import (
	"github.com/gin-gonic/gin"

	"github.com/Jcorrieri/uf-marketplace/backend/database"
	"github.com/Jcorrieri/uf-marketplace/backend/handlers"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
)


func main() {
	// Instantiate database
	db := database.Connect()

	// Get services
	userService := services.NewUserService(db)	

	// Set handlers
	userHandler := handlers.NewUserHandler(userService)

	// Create router
	router := gin.Default()

	// Grouping for cleaner logic
	api := router.Group("/api")
	{
		users := api.Group("/users")
		{
			users.GET("", userHandler.GetUsers)
			users.GET("/:id", userHandler.GetUserById)
			users.POST("", userHandler.AddUser)
			users.DELETE("/:id", userHandler.DeleteUser)
		}
	}

	router.Run("localhost:8080")
}
