package models

import "gorm.io/gorm"

// TODO: Replace gorm ID with UUID
type User struct {
	gorm.Model // handles ID, Timestamps, etc.
	// use a partial index to handle issues when reusing unique fields from soft-deleted entities (https://sqlite.org/partialindex.html).
	Username string `binding:"required" gorm:"uniqueIndex:idx_username_active,where:deleted_at IS NULL;size:50"`
	Email string `binding:"required" gorm:"uniqueIndex:idx_email_active,where:deleted_at IS NULL;size:50"`
	PasswordHash string `binding:"required"`
}

// only return select fields
type UserResponse struct {
	ID uint `json:"id"` // NOTE: Will probably change datatype to string/uuid
	Username string `json:"username"`
	Email string `json:"email"`
}

func (u *User) MapToResponse() UserResponse {
	return UserResponse{
        ID:       u.ID,
        Username: u.Username,
        Email:    u.Email,
    }
}
