package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Order represents a completed purchase between a buyer and a seller.
// Price and title are snapshotted at purchase time so history remains
// accurate even if the listing is later edited or deleted.
type Order struct {
	ID           uuid.UUID `json:"id" gorm:"primaryKey"`
	ListingID    uuid.UUID `json:"listing_id" gorm:"type:uuid;index"`
	BuyerID      uuid.UUID `json:"buyer_id" gorm:"type:uuid;index"`
	SellerID     uuid.UUID `json:"seller_id" gorm:"type:uuid;index"`
	ListingTitle string    `json:"listing_title" gorm:"not null"`
	Price        float64   `json:"price" gorm:"not null"`
	Buyer        User      `json:"-" gorm:"foreignKey:BuyerID"`
	Seller       User      `json:"-" gorm:"foreignKey:SellerID"`
	CreatedAt    time.Time `json:"created_at" gorm:"index"`
}

// BeforeCreate assigns a UUID v7 before inserting a new order.
func (o *Order) BeforeCreate(tx *gorm.DB) error {
	id, err := uuid.NewV7()
	o.ID = id
	return err
}

// OrderResponse is the sanitised JSON payload returned by the API.
type OrderResponse struct {
	ID           uuid.UUID `json:"id"`
	ListingID    uuid.UUID `json:"listing_id"`
	ListingTitle string    `json:"listing_title"`
	Price        float64   `json:"price"`
	BuyerID      uuid.UUID `json:"buyer_id"`
	BuyerName    string    `json:"buyer_name"`
	SellerID     uuid.UUID `json:"seller_id"`
	SellerName   string    `json:"seller_name"`
	CreatedAt    time.Time `json:"created_at"`
}

// GetResponse converts an Order (with preloaded Buyer/Seller) to an OrderResponse.
func (o *Order) GetResponse() OrderResponse {
	return OrderResponse{
		ID:           o.ID,
		ListingID:    o.ListingID,
		ListingTitle: o.ListingTitle,
		Price:        o.Price,
		BuyerID:      o.BuyerID,
		BuyerName:    o.Buyer.FirstName + " " + o.Buyer.LastName,
		SellerID:     o.SellerID,
		SellerName:   o.Seller.FirstName + " " + o.Seller.LastName,
		CreatedAt:    o.CreatedAt,
	}
}
