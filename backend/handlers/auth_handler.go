package handlers

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
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
	Username  string `json:"username" binding:"required" `
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
	var in RegisterInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	if !strings.HasSuffix(strings.ToLower(in.Email), "@ufl.edu") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "must use @ufl.edu email"})
		return
	}

	req := services.CreateUserRequest{
		Email:     in.Email,
		Username:  in.Username,
		FirstName: in.FirstName,
		LastName:  in.LastName,
		Password:  in.Password,
	}

	user, err := h.userService.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create user"})
		return
	}

	c.JSON(http.StatusCreated, user.GetResponse())
}

// Simple login endpoint: checks email and password, returns success if correct
func (h *AuthHandler) Login(c *gin.Context) {
	var in LoginInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	user, err := h.userService.GetByEmail(c.Request.Context(), in.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := h.userService.CheckPassword(user, in.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// Issue a short-lived JWT access token for the client to use in
	// Authorization: Bearer <token> headers. The secret is read from
	// `JWT_SECRET` (fall back to a dev secret if unset).
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret"
	}

	claims := jwt.MapClaims{
		"sub":   user.ID.String(),
		"email": user.Email,
		"exp":   time.Now().Add(15 * time.Minute).Unix(),
	}

	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"access_token": signed})
}

// Logout endpoint: invalidates session on server (if implemented)
// and clears any session cookie on the client.
func (h *AuthHandler) Logout(c *gin.Context) {
	token, _ := c.Cookie(services.SessionCookieName)
	if token == "" {
		auth := c.GetHeader("Authorization")
		if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
			token = strings.TrimSpace(auth[7:])
		}
	}

	_ = h.authService.Logout(c.Request.Context(), token)
	c.SetCookie(services.SessionCookieName, "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "logout successful"})
}
