package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderStatus string

const (
	OrderStatusPending    OrderStatus = "pending"
	OrderStatusCompleted  OrderStatus = "completed"
	OrderStatusCancelled  OrderStatus = "cancelled"
)

type Order struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	BuyerID   uuid.UUID      `json:"buyer_id" gorm:"type:uuid,index"`
	Buyer     User           `json:"-" gorm:"foreignKey:BuyerID"`
	SellerID  uuid.UUID      `json:"seller_id" gorm:"type:uuid,index"`
	Seller    User           `json:"-" gorm:"foreignKey:SellerID"`
	ListingID uint           `json:"listing_id" gorm:"index"`
	Listing   Listing        `json:"-" gorm:"foreignKey:ListingID"`
	Price     float64        `json:"price"`
	Status    OrderStatus    `json:"status" gorm:"type:text;default:'pending'"`
	CreatedAt time.Time      `gorm:"index"`
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

type OrderResponse struct {
	ID          uint      `json:"id"`
	ListingID   uint      `json:"listing_id"`
	ListingName string    `json:"listing_name"`
	Price       float64   `json:"price"`
	SellerName  string    `json:"seller_name"`
	BuyerName   string    `json:"buyer_name"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (o *Order) GetResponse() OrderResponse {
	return OrderResponse{
		ID:          o.ID,
		ListingID:   o.ListingID,
		ListingName: o.Listing.Title,
		Price:       o.Price,
		SellerName:  o.Seller.FirstName + " " + o.Seller.LastName,
		BuyerName:   o.Buyer.FirstName + " " + o.Buyer.LastName,
		Status:      string(o.Status),
		CreatedAt:   o.CreatedAt,
		UpdatedAt:   o.UpdatedAt,
	}
}
