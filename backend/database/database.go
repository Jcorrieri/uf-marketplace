package database

import (
	"context"
	"fmt"
	// "log"
	// "os"

	"github.com/Jcorrieri/uf-marketplace/backend/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Create some starter data for testing
func SeedData(db *gorm.DB, ctx context.Context) {
	books := []models.Book{
		{
			Title: "Hello, World!",
			Author: "Backend, The",
			Content: "Hello from the backend!",
		},
		{
			Title: "Percy Jackson and The Lightning Thief",
			Author: "Rick Riordan",
			Content: "Greek gods and such ya know the big P Jackson.",
		},
	}

	for _, book := range books {
		_, err := gorm.G[models.Book](db).Where("title = ?", book.Title).First(ctx)

		if err == gorm.ErrRecordNotFound {
			gorm.G[models.Book](db).Create(ctx, &book)
		}
	}

	fmt.Println("Successfully seeded database.")
}

func Connect() *gorm.DB {
	ctx := context.Background()

	// Connect to db
	fmt.Println("Attempting database connection...")

	db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	fmt.Println("Database connection established")

	// Create/update tables
	err = db.AutoMigrate(&models.Book{})
	if err != nil {
		panic("Failed to automigrate")
	}

	shouldSeed := true // replace with env variable for dev mode
	if shouldSeed {
		SeedData(db, ctx)
	}

	return db
}

