package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Order struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	BuyerID      uuid.UUID `gorm:"type:uuid;index"`
	ListingID    uuid.UUID `gorm:"type:uuid;index"`
	Title        string
	Description  string
	Price        float64
	FirstImageID *uuid.UUID `gorm:"type:uuid"`
	SellerName   string
	Status       string    `gorm:"size:32"`
	PurchasedAt  time.Time `gorm:"index"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// NOTE: https://gorm.io/docs/hooks.html
func (o *Order) BeforeCreate(tx *gorm.DB) error {
	id, err := uuid.NewV7()
	o.ID = id
	return err
}

type OrderResponse struct {
	OrderID      uuid.UUID  `json:"order_id"`
	ListingID    uuid.UUID  `json:"listing_id"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	Price        float64    `json:"price"`
	FirstImageID *uuid.UUID `json:"first_image_id"`
	SellerName   string     `json:"seller_name"`
	PurchasedAt  time.Time  `json:"purchased_at"`
	Status       string     `json:"status"`
}

func (o *Order) GetResponse() OrderResponse {
	return OrderResponse{
		OrderID:      o.ID,
		ListingID:    o.ListingID,
		Title:        o.Title,
		Description:  o.Description,
		Price:        o.Price,
		FirstImageID: o.FirstImageID,
		SellerName:   o.SellerName,
		PurchasedAt:  o.PurchasedAt,
		Status:       o.Status,
	}
}
