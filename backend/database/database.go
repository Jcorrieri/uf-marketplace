package database

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"

	// "log"
	// "os"

	"github.com/Jcorrieri/uf-marketplace/backend/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func generateNumericUFID(length int) (string, error) {
	if length <= 0 {
		return "", fmt.Errorf("length must be greater than zero")
	}

	digits := make([]byte, length)
	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		digits[i] = byte('0' + n.Int64())
	}

	return string(digits), nil
}

// Backfill UFIDs for existing accounts created before UFID became required.
func backfillMissingUFIDs(ctx context.Context, db *gorm.DB) error {
	var users []models.User
	err := db.WithContext(ctx).
		Where("uf_id = '' OR uf_id IS NULL").
		Find(&users).Error
	if err != nil {
		return err
	}

	if len(users) == 0 {
		return nil
	}

	for _, user := range users {
		ufid, err := generateNumericUFID(8)
		if err != nil {
			return err
		}

		err = db.WithContext(ctx).
			Model(&models.User{}).
			Where("id = ?", user.ID).
			Update("uf_id", ufid).Error
		if err != nil {
			return err
		}
	}

	fmt.Printf("Backfilled UF IDs for %d account(s).\n", len(users))
	return nil
}

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

	if err := backfillMissingUFIDs(ctx, db); err != nil {
		panic("Failed to backfill missing UF IDs")
	}

	shouldSeed := false // replace with env variable for dev mode
	if shouldSeed {
		SeedData(db, ctx)
	}

	return db
}
