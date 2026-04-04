package models

import "github.com/google/uuid"

type Listing struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	ImageURL    string    `json:"image_url"`
	SellerID    uuid.UUID `json:"seller_id" gorm:"type:uuid"`
	Seller      User      `json:"-" gorm:"foreignKey:SellerID"`
}

type ListingResponse struct {
	ID          uint    `json:"id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	ImageURL    string  `json:"image_url"`
	SellerName  string  `json:"seller_name"`
}

func (l *Listing) GetResponse() ListingResponse {
	return ListingResponse{
		ID:          l.ID,
		Title:       l.Title,
		Description: l.Description,
		Price:       l.Price,
		ImageURL:    l.ImageURL,
		SellerName:  l.Seller.FirstName + " " + l.Seller.LastName,
	}
}
