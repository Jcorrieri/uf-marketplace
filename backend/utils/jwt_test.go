package utils_test

import (
	"errors"
	"testing"
	"time"

	"github.com/Jcorrieri/uf-marketplace/backend/utils"
	"github.com/golang-jwt/jwt/v5"
)

func TestTokenValidation_TableDriven(t *testing.T) {
	type testCase struct {
		name		     string
		providedSecret	 string	
		token			 func() string
		expectedError 	 error	
	}

	tests := []testCase{
		{
			name: "Valid Token",
			providedSecret: "correct_secret",
			token: func() string {
				claims := jwt.RegisteredClaims{Subject: "user123"}
				token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
				s, _ := token.SignedString([]byte("correct_secret"))
				return s
			},	
			expectedError: nil,
		},
		{
			name: "Expired Token",
			providedSecret: "correct_secret",
			token: func() string {
				claims := jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour))}
				token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
				s, _ := token.SignedString([]byte("correct_secret"))
				return s
			},
			expectedError: jwt.ErrTokenExpired,
		},
		{
			name: "Invalid Signing Method",
			providedSecret: "correct_secret",
			token: func() string {
				claims := jwt.RegisteredClaims{Subject: "user123"}
				token := jwt.NewWithClaims(jwt.SigningMethodES256, claims)
				s, _ := token.SignedString([]byte("correct_secret"))
				return s
			},
			expectedError: jwt.ErrTokenMalformed,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := utils.ValidateToken(tc.token(), tc.providedSecret)	
			
			if !errors.Is(err, tc.expectedError) {
				t.Errorf("Expected %v, got %v", tc.expectedError, err)
			}
		})
	}
}
