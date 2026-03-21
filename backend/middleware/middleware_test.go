package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Jcorrieri/uf-marketplace/backend/middleware"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func TestMiddleware_TableDriven(t *testing.T) {
	type testCase struct {
		name			string
		cookieName		string
		cookieValue		string
		providedSecret  string
		expectedStatus	int
		expectedBody	string
	}

	tests := []testCase{
		{
			name: "Missing Cookie",
			cookieName: "wrong_name",
			cookieValue: func() string { return "any" }(),
			providedSecret: "correct_secret",
			expectedStatus: 401,
			expectedBody: `{"error":"Forbidden"}`,
		},
		{
			name:       "Expired Token",
			cookieName: "session_token",
			cookieValue: func() string {
				claims := jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour))}
				token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
				s, _ := token.SignedString([]byte("correct_secret"))
				return s
			}(),
			providedSecret: "correct_secret",
			expectedStatus: 401,
			expectedBody:   `{"error":"Session invalid or expired"}`,
		},
		{
			name:       "Invalid Secret",
			cookieName: "session_token",
			cookieValue: func() string {
				claims := jwt.RegisteredClaims{Subject: "user123"}
				token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
				s, _ := token.SignedString([]byte("WRONG-SECRET"))
				return s
			}(),
			providedSecret: "correct-secret",
			expectedStatus: 401,
			expectedBody:   `{"error":"Session invalid or expired"}`,
		},
		{
			name: 		"Valid Token",
			cookieName: "session_token",
			cookieValue: func() string { 
				claims := jwt.RegisteredClaims{Subject: "user123"}
				token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
				s, _ := token.SignedString([]byte("correct_secret"))
				return s
			}(),
			providedSecret: "correct_secret",
			expectedStatus: 200,
			expectedBody: ``,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			r := gin.New()

			r.Use(middleware.AuthMiddleware(tc.providedSecret, "session_token"))
			r.GET("/test", func(c *gin.Context) {
				c.Status(200)
			})

			req, _ := http.NewRequest("GET", "/test", nil)
			req.AddCookie(&http.Cookie{
				Name:  tc.cookieName,
				Value: tc.cookieValue,
			})

			r.ServeHTTP(w, req)

			if w.Code != tc.expectedStatus {
				t.Errorf("expected status %d, got %d", tc.expectedStatus, w.Code)
			}
			if w.Body.String() != tc.expectedBody {
				t.Errorf("expected body %s, got %s", tc.expectedBody, w.Body.String())
			}
		})
	}
}
