package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	// Using UUID v7; See https://uuid7.com
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey"`
	// use a partial index to handle issues when reusing unique fields from soft-deleted entities (https://sqlite.org/partialindex.html).
	Username     string         `gorm:"uniqueIndex:idx_username_active,where:deleted_at IS NULL;size:100;not null"`
	Email        string         `gorm:"uniqueIndex:idx_email_active,where:deleted_at IS NULL;size:255;not null"`
	PasswordHash string         `json:"-" gorm:"not null"`
	FirstName    string         `gorm:"not null"`
	LastName     string         `gorm:"not null"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    gorm.DeletedAt `gorm:"index"`
}

// The actual JSON object returned by the API
type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	CreatedAt time.Time `json:"created_at"`
}

// NOTE: https://gorm.io/docs/hooks.html
func (u *User) BeforeCreate(tx *gorm.DB) error {
	id, err := uuid.NewV7()
	u.ID = id
	return err
}

func (u *User) GetResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		Username:  u.Username,
		Email:     u.Email,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		CreatedAt: u.CreatedAt,
	}
}
