package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Listing struct {
	ID          uint      	   `json:"id" gorm:"primaryKey"`
	Title       string    	   `json:"title"`
	Description string    	   `json:"description"`
	Price       float64   	   `json:"price"`
	ImageURL    string    	   `json:"image_url"`
	SellerID    uuid.UUID 	   `json:"seller_id" gorm:"type:uuid,index"`
	Seller      User      	   `json:"-" gorm:"foreignKey:SellerID"`
	CreatedAt   time.Time 	   `gorm:"index"`
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

type ListingResponse struct {
	ID          uint      `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	ImageURL    string    `json:"image_url"`
	SellerName  string    `json:"seller_name"`
	CreatedAt	time.Time `json:"created_at"`
	UpdatedAt	time.Time `json:"updated_at"`
}

func (l *Listing) GetResponse() ListingResponse {
	return ListingResponse{
		ID:          l.ID,
		Title:       l.Title,
		Description: l.Description,
		Price:       l.Price,
		ImageURL:    l.ImageURL,
		SellerName:  l.Seller.FirstName + " " + l.Seller.LastName,
		CreatedAt:   l.CreatedAt,
		UpdatedAt: 	 l.UpdatedAt,
	}
}
