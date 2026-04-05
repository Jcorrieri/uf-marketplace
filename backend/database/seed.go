package database

import (
	"context"
	"errors"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func SeedListings(db *gorm.DB, ctx context.Context, ids []uuid.UUID) (error){
	listings := []*models.Listing{
		{
			ID: 1,
			ImageURL: "https://picsum.photos/seed/desk/400/300",
		  	Title: "Standing Desk",
			Description: "Adjustable standing desk, great condition. Perfect for studying.",
		  	Price: 85,
		  	SellerID: ids[0],
		},
		{
		  	ID: 2,
		  	ImageURL: "https://picsum.photos/seed/bike/400/300",
		  	Title: "Mountain Bike",
		  	Description: "Trek mountain bike, barely used. Includes lock and helmet.",
		  	Price: 220,
		  	SellerID: ids[3],
		},
		{
		  	ID: 3,
		  	ImageURL: "https://picsum.photos/seed/textbook/400/300",
		  	Title: "Organic Chemistry Textbook",
		  	Description: "8th edition, no highlights. ISBN 978-0134042282.",
		  	Price: 45,
		  	SellerID: ids[2],
		},
		{
		  	ID: 4,
		  	ImageURL: "https://picsum.photos/seed/monitor/400/300",
		  	Title: "27\" Monitor",
		  	Description: "Dell 27\" 1440p IPS monitor. Comes with HDMI cable.",
		  	Price: 150,
		  	SellerID: ids[3],
		},
		{
		  	ID: 5,
		  	ImageURL: "https://picsum.photos/seed/couch/400/300",
		  	Title: "Futon Couch",
		  	Description: "Foldable futon, dark grey. Great for dorm rooms.",
		  	Price: 60,
		  	SellerID: ids[4],
		},
		{
		  	ID: 6,
		  	ImageURL: "https://picsum.photos/seed/guitar/400/300",
		  	Title: "Acoustic Guitar",
		  	Description: "Yamaha FG800, excellent sound. Includes gig bag and tuner.",
		  	Price: 130,
		  	SellerID: ids[5],
		},
		{
		  	ID: 7,
		  	ImageURL: "https://picsum.photos/seed/lamp/400/300",
		  	Title: "Desk Lamp",
		  	Description: "LED desk lamp with USB charging port. 3 brightness levels.",
		  	Price: 18,
		  	SellerID: ids[6],
		},
		{
		  	ID: 8,
		  	ImageURL: "https://picsum.photos/seed/backpack/400/300",
		  	Title: "North Face Backpack",
		  	Description: "Black Borealis backpack, very spacious. Minor wear.",
		  	Price: 40,
		  	SellerID: ids[7],
		},
	}

	listingService := services.NewListingService(db)

	for _, listing := range listings {
		if err := listingService.Create(ctx, listing); err != nil {
			return err
		}
	}

	return nil
}

func SeedUsers(db *gorm.DB, ctx context.Context) ([]*models.User, error) {
	userRequests := []services.CreateUserRequest{
		{
			Email:     "jsmack@ufl.edu",
			Password:  "password",
			FirstName: "John",
			LastName:  "Smack",
		},
		{
			Email:     "adoe@ufl.edu",
			Password:  "password",
			FirstName: "Alice",
			LastName:  "Doe",
		},
		{
			Email:     "bsmith@ufl.edu",
			Password:  "password",
			FirstName: "Bob",
			LastName:  "Smith",
		},
		{
			Email:     "cjohnson@ufl.edu",
			Password:  "password",
			FirstName: "Carol",
			LastName:  "Johnson",
		},
		{
			Email:     "dlee@ufl.edu",
			Password:  "password",
			FirstName: "David",
			LastName:  "Lee",
		},
		{
			Email:     "ewalker@ufl.edu",
			Password:  "password",
			FirstName: "Emma",
			LastName:  "Walker",
		},
		{
			Email:     "fmartin@ufl.edu",
			Password:  "password",
			FirstName: "Frank",
			LastName:  "Martin",
		},
		{
			Email:     "gclark@ufl.edu",
			Password:  "password",
			FirstName: "Grace",
			LastName:  "Clark",
		},
		{
			Email:     "hlopez@ufl.edu",
			Password:  "password",
			FirstName: "Hector",
			LastName:  "Lopez",
		},
		{
			Email:     "ikim@ufl.edu",
			Password:  "password",
			FirstName: "Ivy",
			LastName:  "Kim",
		},
	}

	userService := services.NewUserService(db)

	// Assume already seeded if jsmack@ufl.edu exists
	_, err := userService.GetByEmail(ctx, "jsmack@ufl.edu")
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	} else {
		return nil, errors.New("Database already seeded.")
	}

	users := []*models.User{}
	for _, user := range userRequests {
		user, err := userService.Create(ctx, user)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}
