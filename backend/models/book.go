package models

import "gorm.io/gorm"

// Will create a SQL table called 'books' with Book records
type Book struct {
	gorm.Model // handles ID, Timestamps, etc.
	Title string `json:"title" binding:"required" gorm:"size:100;unique"`
	Author string `json:"author" binding:"required" gorm:"size:100"`
	Content string `json:"content"` // for backwards compatibility w/ hello-world endpoint
}
