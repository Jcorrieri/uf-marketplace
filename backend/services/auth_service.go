package services

import (
	"context"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"

	"gorm.io/gorm"
)

// Define the service struct whose only dependency is the db connection.
// Services will handle all database operations for each model (users, posts, etc.).
// See https://gorm.io/docs/the_generics_way.html for generics API usage.
type AuthService struct {
	db *gorm.DB
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}
