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
	bookService := services.NewBookService(db)	

	// Set handlers
	bookHandler := handlers.NewBookHandler(bookService)

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
	}

	router.Run("localhost:8080")
}
