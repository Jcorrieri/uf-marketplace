package models

import "gorm.io/gorm"

// Will create a SQL table called 'books' with Book records
type Book struct {
	gorm.Model // handles ID, Timestamps, etc.
	// use a partial index to handle issues when reusing unique fields from soft-deleted entities (https://sqlite.org/partialindex.html).
	Title string `json:"title" binding:"required" gorm:"uniqueIndex:idx_username_active,where:deleted_at IS NULL;size:100"`
	Author string `json:"author" binding:"required" gorm:"size:100"`
	Content string `json:"content"` // for backwards compatibility w/ hello-world endpoint
}
