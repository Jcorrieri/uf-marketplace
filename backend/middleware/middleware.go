package middleware

import (
	"github.com/Jcorrieri/uf-marketplace/backend/utils"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(secret, sessionCookieName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie(sessionCookieName)
		if err != nil {
			c.AbortWithStatusJSON(401, gin.H{"error": "Please log in"})
			return
		}

		claims, err := utils.ValidateToken(tokenString, secret)
		if err != nil || claims == nil {
			c.AbortWithStatusJSON(401, gin.H{"error": "Session invalid or expired"})
			return
		}

		c.Set("userID", claims.Subject)
		c.Next()
	}
}
