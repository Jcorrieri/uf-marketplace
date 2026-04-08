package database

import (
	"context"
	"fmt"
	"os"
	"strconv"

	// "log"
	// "os"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Create some starter data for testing
func SeedData(db *gorm.DB, ctx context.Context) {
	users, err := SeedUsers(db, ctx)
	if err != nil {
		fmt.Println(err.Error())
		return
	}

	ids := []uuid.UUID{}
	for _, user := range users {
		ids = append(ids, user.ID)
	}

	if err := SeedListings(db, ctx, ids); err != nil {
		panic("Error seeding listings.")
	}
		
	fmt.Println("Successfully seeded database.")
}

func Connect(dbName string) *gorm.DB {
	ctx := context.Background()

	// Connect to db
	fmt.Println("Attempting database connection...")

	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	fmt.Println("Database connection established")

	// Create/update tables
	err = db.AutoMigrate(
		&models.User{},
		&models.Listing{},
		&models.ListingImage{},
	)

	if err != nil {
		panic("Failed to automigrate")
	}

	shouldSeedStr := os.Getenv("SHOULD_SEED")
	shouldSeed, err := strconv.ParseBool(shouldSeedStr)
	if err != nil {
		panic("Failed to parse SHOULD_SEED env variable.")
	}

	if shouldSeed {
		SeedData(db, ctx)
	}

	return db
}
