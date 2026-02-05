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


	// TODO: Replace + delete placeholder routes
	router.GET("/books", bookHandler.GetBooks)
	router.GET("/books/:id", bookHandler.GetBookById)
	router.GET("/hello-world", bookHandler.HelloWorld)
	router.POST("/books", bookHandler.AddBook)
	router.DELETE("/books/:id", bookHandler.DeleteBook)

	router.Run("localhost:8080")
}
