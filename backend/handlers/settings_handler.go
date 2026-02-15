package handlers

import "github.com/Jcorrieri/uf-marketplace/backend/services"

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
