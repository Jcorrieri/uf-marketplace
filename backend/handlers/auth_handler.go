package handlers

import (
	"net/http"
	"strings"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
)

// Set up handler injection
type AuthHandler struct {
	authService *services.AuthService
	userService *services.UserService
}

func NewAuthHandler(as *services.AuthService, us *services.UserService) *AuthHandler {
	return &AuthHandler{
		authService: as,
		userService: us,
	}
}

// Ingestion structs
type RegisterInput struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user input"})
	}

	// Check if email is UF email (optional - for UF students only)
	if !strings.HasSuffix(strings.ToLower(input.Email), "@ufl.edu") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Must use a valid UF email (@ufl.edu)"})
		return
	}

	// Pass checking if user exists and password hashing to service layer
	// h.userService.Create()
}
