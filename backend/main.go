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
	bookService := services.NewBookService(db)
	userService := services.NewUserService(db)

	// Set handlers
	bookHandler := handlers.NewBookHandler(bookService)
	settingsHandler := handlers.NewSettingsHandler(userService)

	// Create router
	router := gin.Default()

	// Grouping for cleaner logic
	api := router.Group("/api")
	{
		books := api.Group("/books")
		{
			books.GET("", bookHandler.GetBooks)
			books.GET("/:id", bookHandler.GetBookById)
			books.POST("", bookHandler.AddBook)
			books.DELETE("/:id", bookHandler.DeleteBook)
		}

		settings := api.Group("/settings")
		{
			settings.GET("", settingsHandler.GetSettings)
			settings.PUT("", settingsHandler.UpdateSettings)

		}

	}

	router.Run("localhost:8080")
}
