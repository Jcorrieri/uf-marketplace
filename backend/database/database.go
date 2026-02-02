package database

import (
	"fmt"
	// "log"
	// "os"

	"github.com/Jcorrieri/uf-marketplace/backend/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func Connect() *gorm.DB {
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

	return db
}

