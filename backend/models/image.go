package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NOTE: https://gorm.io/docs/polymorphism.html
type Image struct {
	ID        uuid.UUID `gorm:"primaryKey"`
	OwnerID   uuid.UUID `gorm:"not null;index"`
	OwnerType string    `gorm:"not null;index"` // "listings" or "users"
	Data      []byte    `gorm:"type:blob;not null"`
	MimeType  string    `gorm:"not null"`  // "image/jpeg", etc.
	Position  int       `gorm:"default:0"` // ordering for multi-image listings
	CreatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// NOTE: https://gorm.io/docs/hooks.html
func (i *Image) BeforeCreate(tx *gorm.DB) error {
	id, err := uuid.NewV7()
	i.ID = id
	return err
}
