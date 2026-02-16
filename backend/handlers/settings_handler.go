package handlers

import (
	"net/http"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SettingsHandler handles user settings endpoints
type SettingsHandler struct {
	userService *services.UserService
}

// Constructor
func NewSettingsHandler(us *services.UserService) *SettingsHandler {
	return &SettingsHandler{
		userService: us,
	}
}

// TEMP: hardcoded user ID until auth exists
var dummyUserID = uuid.MustParse("00000000-0000-0000-0000-000000000001")

func (h *SettingsHandler) GetSettings(c *gin.Context) {
	user, err := h.userService.GetByID(c.Request.Context(), dummyUserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})

		return
	}

	c.JSON(http.StatusOK, user.GetResponse())
}

type UpdateSettingsInput struct {
	Username  string `json:"username" binding:"required,min=3"`
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
}

func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	var input UpdateSettingsInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Username, first name, and last name are required",
		})
		return
	}

	user, err := h.userService.UpdateSettings(
		dummyUserID,
		services.UpdateUserRequest{
			Username:  input.Username,
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
