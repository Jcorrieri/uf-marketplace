package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Listing struct {
	ID          uuid.UUID `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	SellerID    uuid.UUID `json:"seller_id" gorm:"type:uuid,index"`
	Seller      User      `json:"-" gorm:"foreignKey:SellerID"`
	Images      []Image   `json:"images" gorm:"polymorphic:Owner;constraint:OnDelete:CASCADE;"`
	CreatedAt   time.Time `gorm:"index"`
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

// NOTE: https://gorm.io/docs/hooks.html
func (l *Listing) BeforeCreate(tx *gorm.DB) error {
	id, err := uuid.NewV7()
	l.ID = id
	return err
}

type ListingResponse struct {
	ID           uuid.UUID  `json:"id"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	Price        float64    `json:"price"`
	ImageCount   int        `json:"image_count"`
	FirstImageID *uuid.UUID `json:"first_image_id"`
	SellerName   string     `json:"seller_name"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (l *Listing) GetResponse() ListingResponse {
	var firstImageID *uuid.UUID
	if len(l.Images) > 0 {
		firstImageID = &l.Images[0].ID
	}
	return ListingResponse{
		ID:           l.ID,
		Title:        l.Title,
		Description:  l.Description,
		Price:        l.Price,
		ImageCount:   len(l.Images),
		FirstImageID: firstImageID,
		SellerName:   l.Seller.FirstName + " " + l.Seller.LastName,
		CreatedAt:    l.CreatedAt,
		UpdatedAt:    l.UpdatedAt,
	}
}
