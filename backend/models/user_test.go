package models_test

import (
	"testing"
	"time"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func TestUserResponse(t * testing.T) {
	// Create a mock user, then test if the response works.
	// Not testing w/ null fields - already checked by gorm constraints.
	id, err := uuid.NewV7()
	if err != nil {
		t.Error("Failed to create user ID")
	}

	user := models.User{
		ID: id,
		Email: "test@ufl.edu",
		PasswordHash: "password",
		FirstName: "John",
		LastName: "Doe",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		DeletedAt: gorm.DeletedAt{},
	}

	response := user.GetResponse()

	if response.ID != user.ID {
		t.Errorf("ID mismatch: got %v, want %v", response.ID, user.ID)
	}
	if response.Email != user.Email {
		t.Errorf("Email mismatch: got %v, want %v", response.Email, user.Email)
	}
	if response.FirstName != user.FirstName {
		t.Errorf("First name mismatch: got %v, want %v", response.FirstName, user.FirstName)
	}
	if response.LastName != user.LastName {
		t.Errorf("Last name mismatch: got %v, want %v", response.LastName, user.LastName)
	}
	if !response.CreatedAt.Equal(user.CreatedAt) {
		t.Errorf("CreatedAt mismatch: got %v, want %v", response.CreatedAt, user.CreatedAt)
	}

} 
