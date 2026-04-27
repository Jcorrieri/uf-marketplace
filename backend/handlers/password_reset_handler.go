package handlers

import (
	"errors"
	"net/http"
	"net/url"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
)

type PasswordResetHandler struct {
	passwordResetService *services.PasswordResetService
}

func NewPasswordResetHandler(passwordResetService *services.PasswordResetService) *PasswordResetHandler {
	return &PasswordResetHandler{passwordResetService: passwordResetService}
}

type ForgotPasswordInput struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordInput struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

func (h *PasswordResetHandler) ForgotPassword(c *gin.Context) {
	var in ForgotPasswordInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	token, err := h.passwordResetService.CreatePasswordResetToken(c.Request.Context(), in.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not process forgot password request"})
		return
	}

	response := gin.H{
		"message": "If an account exists for that email, a password reset link has been generated.",
	}

	// Development-only fallback while email delivery is not wired yet.
	if token != "" {
		response["reset_token"] = token
		response["reset_path"] = "/reset-password?token=" + url.QueryEscape(token)
	}

	c.JSON(http.StatusOK, response)
}

func (h *PasswordResetHandler) ResetPassword(c *gin.Context) {
	var in ResetPasswordInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	err := h.passwordResetService.ResetPassword(c.Request.Context(), in.Token, in.NewPassword)
	if err != nil {
		if errors.Is(err, services.ErrInvalidOrExpiredResetToken) || errors.Is(err, services.ErrPasswordTooShort) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not reset password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password reset successful"})
}
