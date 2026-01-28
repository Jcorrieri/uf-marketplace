package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// temp struct -- remove later
type response struct {
	ID int `json:"id"`
	Content string `json:"content"`
}

var helloWorld = response{ ID: 1, Content: "Hello from the backend!" }

func main() {
	router := gin.Default()
	router.GET("/", getDefault)

	router.Run("localhost:8080")
}

func getDefault(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, helloWorld)
}
