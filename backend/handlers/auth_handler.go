package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Set up handler injection
type AuthHandler struct {
	authService       *services.AuthService
	userService       *services.UserService
	sessionCookieName string
}

func NewAuthHandler(as *services.AuthService, us *services.UserService, sessionCookieName string) *AuthHandler {
	return &AuthHandler{
		authService:       as,
		userService:       us,
		sessionCookieName: sessionCookieName,
	}
}

// Ingestion structs
type RegisterInput struct {
	Email     string `json:"email" binding:"required,email"`
	UFID      string `json:"uf_id" binding:"required"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type ForgotPasswordVerifyInput struct {
	Email string `json:"email" binding:"required,email"`
	UFID  string `json:"uf_id" binding:"required"`
}

type ForgotPasswordResetInput struct {
	Email           string `json:"email" binding:"required,email"`
	UFID            string `json:"uf_id" binding:"required"`
	Password        string `json:"password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
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

	request := services.CreateUserRequest{
		Email:     in.Email,
		UFID:      in.UFID,
		FirstName: in.FirstName,
		LastName:  in.LastName,
		Password:  in.Password,
	}

	user, err := h.userService.Create(c.Request.Context(), request)
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
		fmt.Println("Authentication error:", err) // TODO: replace with proper logging
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// Set HttpOnly cookie to store session token; better than local storage for security
	c.SetSameSite(http.SameSiteLaxMode)

	c.SetCookie(h.sessionCookieName, token, 3600, "/", "", false, true)

	c.JSON(http.StatusOK, user.GetResponse())
}

// Logout endpoint: invalidates JWT on client by clearing cookie
func (h *AuthHandler) Logout(c *gin.Context) {
	token, _ := c.Cookie(h.sessionCookieName)
	if token == "" {
		auth := c.GetHeader("Authorization")
		if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
			_, token, _ = strings.Cut(auth, " ")
			token = strings.TrimSpace(token)
		}
	}

	// Does nothing for now
	if err := h.authService.Logout(c.Request.Context(), token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not logout"})
		return
	}

	// Make client clear cookie
	c.SetCookie(h.sessionCookieName, "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "logout successful"})
}

func (h *AuthHandler) VerifyForgotPasswordAccount(c *gin.Context) {
	var in ForgotPasswordVerifyInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	ok, err := h.authService.VerifyAccountForPasswordReset(c.Request.Context(), in.Email, in.UFID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not verify account"})
		return
	}

	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "account not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "account verified"})
}

func (h *AuthHandler) ResetForgottenPassword(c *gin.Context) {
	var in ForgotPasswordResetInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	if in.Password != in.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "passwords do not match"})
		return
	}

	err := h.authService.ResetPassword(c.Request.Context(), in.Email, in.UFID, in.Password)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "account not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not reset password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}
