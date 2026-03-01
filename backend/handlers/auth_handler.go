package handlers

import (
	"net/http"
	"strings"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
)

// Set up handler injection
type AuthHandler struct {
	authService       *services.AuthService
	userService       *services.UserService
	sessionCookieName string
}

func NewAuthHandler(as *services.AuthService, us *services.UserService, cname string) *AuthHandler {
	return &AuthHandler{
		authService:       as,
		userService:       us,
		sessionCookieName: cname,
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

func (h *AuthHandler) Login(c *gin.Context) {
	var in LoginInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	user, token, err := h.authService.Authenticate(c.Request.Context(), in.Email, in.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// Set HttpOnly cookie to store session token; better than local storage for security
	c.SetSameSite(http.SameSiteLaxMode)

	c.SetCookie(h.sessionCookieName, token, 3600, "/", "", false, true)

	c.JSON(http.StatusOK, user.GetResponse())
}

// Change to JWT
// Logout endpoint: invalidates session on server (if implemented)
// and clears any session cookie on the client.
func (h *AuthHandler) Logout(c *gin.Context) {
	token, _ := c.Cookie(h.sessionCookieName)
	if token == "" {
		auth := c.GetHeader("Authorization")
		if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
			token = strings.TrimSpace(auth[7:])
		}
	}

	_ = h.authService.Logout(c.Request.Context(), token)
	c.SetCookie(h.sessionCookieName, "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "logout successful"})
}
