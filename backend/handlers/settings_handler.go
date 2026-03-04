package handlers

import (
	"net/http"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SettingsHandler handles user settings endpoints.
// NOTE: that the settings are currently just user profile info,
// TODO: Make a distinct model 'settings.go' of user preferences in the future.
// User profile info will be a PATCH endpoint on the user model under /me.
type SettingsHandler struct {
	userService *services.UserService
}

// Constructor
func NewSettingsHandler(us *services.UserService) *SettingsHandler {
	return &SettingsHandler{
		userService: us,
	}
}

// TEMP: hardcoded user ID until auth exists; TODO: Update
// TODO: Replace this with actual user ID from auth context (c.MustGet("userID"))
// TODO: Update with actual settings parameters (not user profile info)
var dummyUserID = uuid.MustParse("00000000-0000-0000-0000-000000000001")

func (h *SettingsHandler) GetSettings(c *gin.Context) {
	// TODO: Get user id from auth ( uuid.Parse(c.MustGet("userID").(string)) )
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

	// TODO: Get user id from auth ( uuid.Parse(c.MustGet("userID").(string)) )
	user, err := h.userService.UpdateSettings(
		c.Request.Context(),
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
