package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Jcorrieri/uf-marketplace/backend/middleware"
	"github.com/Jcorrieri/uf-marketplace/backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

var (
	secret = "test_secret"
	sessionCookieName = "test_cookie"
	middlewareFunction = middleware.AuthMiddleware(secret, sessionCookieName)
)

func TestMiddlewareSetsID(t *testing.T) {
	// Set up gin
	gin.SetMode(gin.TestMode)
	testClient := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(testClient)

	// Create JWT
	expectedID, err := uuid.NewV7()
	if err != nil {
		t.Error("Failed to create user ID")
	}

	token, err := utils.GenerateToken(expectedID, secret) 
	if err != nil {
		t.Error("Failed to generate token")
	}

	// Create request w/ cookie and token
	req, _ := http.NewRequest("GET", "/", nil)
	req.AddCookie(&http.Cookie{
		Name: sessionCookieName,
		Value: token,
	})
	c.Request = req

	middlewareFunction(c)

	// Evaluate 
	val, exists := c.Get("userID")

	assert.True(t, exists, "userID must exist in context")

	parsedVal, err := uuid.Parse(val.(string))
	if err != nil {
		t.Error("Failed to parse uuid from context")
	}

	assert.Equal(t, expectedID, parsedVal)
}

func TestMiddleWareReachesHandlers(t *testing.T) {
	
}

