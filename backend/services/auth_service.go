package services

import (
	"context"

	"gorm.io/gorm"
)

// Define the service struct whose only dependency is the db connection.
// Services will handle all database operations for each model (users, posts, etc.).
// See https://gorm.io/docs/the_generics_way.html for generics API usage.
type AuthService struct {
	db *gorm.DB
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

// SessionCookieName is the cookie name used for session tokens. Exported
// so handlers and other packages can reference the canonical name.
const SessionCookieName = "session"

// Logout performs server-side logout for the supplied session token.
// Current implementation is intentionally minimal (no persistent session
// store). The method accepts the token to make future transitions to
// token revocation or session DB deletions straightforward.
func (s *AuthService) Logout(ctx context.Context, sessionToken string) error {
	// If the application later implements server-side sessions or token
	// blacklisting, revoke the token here (delete DB row / add to denylist).
	// For now, this is a no-op which keeps the service interface stable.
	return nil
}
