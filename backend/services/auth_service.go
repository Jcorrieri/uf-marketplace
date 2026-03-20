package services

import (
	"context"
	"errors"
	"os"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/Jcorrieri/uf-marketplace/backend/utils"
	"golang.org/x/crypto/bcrypt"
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

func (s *AuthService) Authenticate(ctx context.Context, email, password string) (*models.User, string, error) {
	// Check if account exists w/ given email
	user, err := gorm.G[models.User](s.db).Where("email = ?", email).First(ctx)
	if err != nil {
		return nil, "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", err
	}

	// Generate a JWT token for the authenticated user
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return nil, "", errors.New("JWT secret not set")
	}

	token, err := utils.GenerateToken(user.ID, secret)
	if err != nil {
		return nil, "", err
	}

	return &user, token, nil
}

// Logout performs server-side logout for the supplied session token.
func (s *AuthService) Logout(ctx context.Context, sessionToken string) error {
	// If the application later implements server-side sessions or token
	// blacklisting, revoke the token here (delete DB row / add to denylist).
	// For now, this is a no-op which keeps the service interface stable.
	return nil
}

func (s *AuthService) VerifyAccountForPasswordReset(ctx context.Context, email, ufid string) (bool, error) {
	_, err := gorm.G[models.User](s.db).Where("email = ? AND uf_id = ?", email, ufid).First(ctx)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}

	return true, nil
}

func (s *AuthService) ResetPassword(ctx context.Context, email, ufid, newPassword string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	result := s.db.WithContext(ctx).
		Model(&models.User{}).
		Where("email = ? AND uf_id = ?", email, ufid).
		Update("password_hash", string(hash))

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}
