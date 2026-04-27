package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrInvalidOrExpiredResetToken = errors.New("invalid or expired reset token")
	ErrPasswordTooShort           = errors.New("password must be at least 6 characters")
)

type PasswordResetService struct {
	db *gorm.DB
}

func NewPasswordResetService(db *gorm.DB) *PasswordResetService {
	return &PasswordResetService{db: db}
}

// CreatePasswordResetToken creates a one-time reset token for the user if the email exists.
// It returns an empty token when no matching user is found.
func (s *PasswordResetService) CreatePasswordResetToken(ctx context.Context, email string) (string, error) {
	var user models.User
	err := s.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return "", nil
	}
	if err != nil {
		return "", err
	}

	now := time.Now().UTC()
	if err := s.db.WithContext(ctx).
		Model(&models.PasswordResetToken{}).
		Where("user_id = ? AND used_at IS NULL AND expires_at > ?", user.ID, now).
		Updates(map[string]any{"used_at": now}).Error; err != nil {
		return "", err
	}

	rawToken, tokenHash, err := generateResetToken()
	if err != nil {
		return "", err
	}

	record := models.PasswordResetToken{
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: now.Add(30 * time.Minute),
	}
	if err := s.db.WithContext(ctx).Create(&record).Error; err != nil {
		return "", err
	}

	return rawToken, nil
}

func (s *PasswordResetService) ResetPassword(ctx context.Context, token string, newPassword string) error {
	if len(newPassword) < 6 {
		return ErrPasswordTooShort
	}

	now := time.Now().UTC()
	tokenHash := hashResetToken(token)

	var resetToken models.PasswordResetToken
	err := s.db.WithContext(ctx).
		Where("token_hash = ? AND used_at IS NULL AND expires_at > ?", tokenHash, now).
		First(&resetToken).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrInvalidOrExpiredResetToken
	}
	if err != nil {
		return err
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.User{}).
			Where("id = ?", resetToken.UserID).
			Update("password_hash", string(passwordHash)).Error; err != nil {
			return err
		}

		if err := tx.Model(&models.PasswordResetToken{}).
			Where("id = ?", resetToken.ID).
			Update("used_at", now).Error; err != nil {
			return err
		}

		if err := tx.Model(&models.PasswordResetToken{}).
			Where("user_id = ? AND used_at IS NULL", resetToken.UserID).
			Update("used_at", now).Error; err != nil {
			return err
		}

		return nil
	})
}

func generateResetToken() (string, string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", "", err
	}
	raw := hex.EncodeToString(buf)
	return raw, hashResetToken(raw), nil
}

func hashResetToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}
