package handlers

import (
	"net/http"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/Jcorrieri/uf-marketplace/backend/utils"
	"github.com/google/uuid"

	"github.com/gin-gonic/gin"
)

// Define the handler struct whose only dependency is the user service.
// Handlers will contain logic for the RestAPI endpoints, and interact
// with service methods to execute db operations.
type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(s *services.UserService) *UserHandler {
	return &UserHandler{userService: s}
}

func (h *UserHandler) GetCurrentUser(c *gin.Context) {
	userID, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.userService.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user.GetResponse())
}

// GetUserById retrieves a user by their ID from the request context (i.e., seller profiles)
func (h *UserHandler) GetUserById(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	user, err := h.userService.GetByID(c.Request.Context(), id)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user.GetResponse())
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = h.userService.Delete(c.Request.Context(), id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting user"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

type UpdateUserRequest struct {
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
}

func (h *UserHandler) UpdateSettings(c *gin.Context) {
	var input UpdateUserRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "First name, and last name are required",
		})
		return
	}

	id, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	user, err := h.userService.Update(
		c.Request.Context(),
		id,
		services.UpdateUserRequest{
			FirstName: input.FirstName,
			LastName:  input.LastName,
		},
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, user.GetResponse())
}

// PUT /api/users/me/profile-image
func (h *UserHandler) UploadProfileImage(c *gin.Context) {
	id, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	fileHeader, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image provided"})
		return
	}

	data, mimeType, err := utils.ProcessImageFile(fileHeader)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	imageID, err := h.userService.UpdateProfileImage(c.Request.Context(), id, data, mimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile image updated", "image_id": imageID})
}
