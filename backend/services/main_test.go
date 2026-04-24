package services_test

import (
	"context"
	"errors"
	"fmt"
	"os"
	"testing"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var (
	dbFile    = "mock.db"
	db        *gorm.DB
	testUser  models.User
	testImage models.Image
)

func setupDB() {
	ctx := context.Background()
	var err error

	db, err = gorm.Open(sqlite.Open(dbFile), &gorm.Config{})
	if err != nil {
		fmt.Println("failed to connect database")
		os.Exit(1)
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.Image{},
		&models.Listing{},
		&models.Order{},
	)
	if err != nil {
		fmt.Println("Failed to automigrate")
		os.Exit(1)
	}

	password, err := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println("Failed to generate password")
		os.Exit(1)
	}
	testUser = models.User{
		Email:        "mock@ufl.edu",
		PasswordHash: string(password),
		FirstName:    "John",
		LastName:     "Doe",
	}
	if err := gorm.G[models.User](db).Create(ctx, &testUser); err != nil {
		fmt.Println("Failed to create user.")
		os.Exit(1)
	}

	testImage = models.Image{
		OwnerID:   uuid.New(),
		OwnerType: "listing",
		Position:  0,
		Data:      []byte{},
		MimeType:  "jpg",
	}
	if err := gorm.G[models.Image](db).Create(ctx, &testImage); err != nil {
		fmt.Println("Failed to create image.")
		os.Exit(1)
	}
}

func teardown() {
	sqlDB, _ := db.DB()
	if sqlDB != nil {
		sqlDB.Close()
	}

	err := os.Remove(dbFile)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		fmt.Println("Failed to clean up sqlite file")
		os.Exit(1)
	}
}

func TestMain(m *testing.M) {
	exitCode := func() int {
		setupDB()
		defer teardown()
		return m.Run()
	}()

	os.Exit(exitCode)
}
