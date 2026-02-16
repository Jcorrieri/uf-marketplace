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
	err = db.AutoMigrate(
		&models.User{},
	)

	if err != nil {
		panic("Failed to automigrate")
	}

	shouldSeed := false // replace with env variable for dev mode
	if shouldSeed {
		SeedData(db, ctx)
	}

	return db
}
