package services_test

import (
	"context"
	"errors"
	"testing"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func TestAuthBadPassword(t *testing.T) {
	ctx := context.Background()
	authService := services.NewAuthService(db)
	_, _, err := authService.Authenticate(ctx, testUser.Email, "bad_password")

	if !errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
		t.Errorf("Expected %v, got %v", bcrypt.ErrMismatchedHashAndPassword, err)
	}
}

func TestAuthBadEmail(t *testing.T) {
	ctx := context.Background()
	authService := services.NewAuthService(db)
	_, _, err := authService.Authenticate(ctx, "bad@ufl.edu", testUser.PasswordHash)

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Errorf("Expected %v, got %v", gorm.ErrRecordNotFound, err)
	}
}
