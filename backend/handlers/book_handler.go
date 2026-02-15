package handlers

import (
	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Define the handler struct whose only dependency is the book service.
// Handlers will contain logic for the RestAPI endpoints, and interact
// with service methods to execute db operations.
type BookHandler struct {
	service *services.BookService
}

func NewBookHandler(s *services.BookService) *BookHandler {
	return &BookHandler{service: s}
}

func (h *BookHandler) GetBooks(c *gin.Context) {
	// Pass just c.Request.Context() instead of the full request for
	// better performance and cleaner separation of responsibilities.

	// Call service method (see book_service.go)
	books, err := h.service.GetAll(c.Request.Context())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching books"})
		return
	}

	c.JSON(http.StatusOK, books)
}

func (h *BookHandler) GetBookById(c *gin.Context) {
	// DB uses unsigned int for ids, so parse uint
	id, err := strconv.ParseUint(c.Param("id"), 10, 0)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
	}

	book, err := h.service.Get(c.Request.Context(), uint(id))

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	c.JSON(http.StatusOK, book)
}

func (h *BookHandler) AddBook(c *gin.Context) {
	var book models.Book

	// Use ShouldBind to customize error message
	if err := c.ShouldBind(&book); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Book"})
		return
	}

	err := h.service.Create(c.Request.Context(), &book)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating book: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, book)
}

func (h *BookHandler) DeleteBook(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 0)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
	}

	err = h.service.Delete(c.Request.Context(), uint(id))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting book"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
