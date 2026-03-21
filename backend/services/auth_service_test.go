package services_test

import (
	"context"
	"errors"
	"os"
	"testing"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var (
	dbFile = "mock.db"
	db 	*gorm.DB
	testUser models.User
)

func setupDB() {
	ctx := context.Background()
	var err error

	db, err = gorm.Open(sqlite.Open(dbFile), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	err = db.AutoMigrate(
		&models.User{},
	)
	if err != nil {
		panic("Failed to automigrate")
	}

	password, err := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
	if err != nil {
		panic("Failed to generate password")
	}

	testUser = models.User{
		Email: "mock@ufl.edu",
		PasswordHash: string(password),
		FirstName: "John",
		LastName: "Doe",
	}

	if err := gorm.G[models.User](db).Create(ctx, &testUser); err != nil {
		panic("Failed to create user.")
	}
}

func teardown() {
	sqlDB, _ := db.DB()
	if sqlDB != nil {
		sqlDB.Close()
	}

	err := os.Remove(dbFile) 
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		panic("Failed to clean up sqlite file")
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

func TestAuthBadPassword(t *testing.T) {
	ctx := context.Background()
	authService := services.NewAuthService(db)
	_, _, err := authService.Authenticate(ctx, testUser.Email, "bad_password")

	if !errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
		t.Errorf("Expected %v, got %v", bcrypt.ErrMismatchedHashAndPassword, err)
	}
}

func TestAuthBadEmail(t *testing.T) {
	ctx := context.Background()
	authService := services.NewAuthService(db)
	_, _, err := authService.Authenticate(ctx, "bad@ufl.edu", testUser.PasswordHash)

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Errorf("Expected %v, got %v", gorm.ErrRecordNotFound, err)
	}	
}
