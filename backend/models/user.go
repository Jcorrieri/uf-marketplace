package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	// Using UUID v7; See https://uuid7.com
	ID uuid.UUID `gorm:"type:uuid;primaryKey"`
	// use a partial index to handle issues when reusing unique fields from soft-deleted entities (https://sqlite.org/partialindex.html).
	Email        string `gorm:"uniqueIndex:idx_email_active,where:deleted_at IS NULL;size:255;not null"`
	PasswordHash string `json:"-" gorm:"not null"`
	FirstName    string `gorm:"not null"`
	LastName     string `gorm:"not null"`
	ProfileImage Image  `json:"image" gorm:"polymorphic:Owner;constraint:OnDelete:CASCADE;"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    gorm.DeletedAt `gorm:"index"`
}

// NOTE: https://gorm.io/docs/hooks.html
func (u *User) BeforeCreate(tx *gorm.DB) error {
	id, err := uuid.NewV7()
	u.ID = id
	return err
}

// The actual JSON object returned by the API
type UserResponse struct {
	ID        uuid.UUID  `json:"id"`
	Email     string     `json:"email"`
	FirstName string     `json:"first_name"`
	LastName  string     `json:"last_name"`
	ImageID   *uuid.UUID `json:"image_id"`
	CreatedAt time.Time  `json:"created_at"`
}

func (u *User) GetResponse() UserResponse {
	var imageID *uuid.UUID
	if u.ProfileImage.ID != uuid.Nil {
		imageID = &u.ProfileImage.ID
	}
	return UserResponse{
		ID:        u.ID,
		Email:     u.Email,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		ImageID:   imageID,
		CreatedAt: u.CreatedAt,
	}
}
