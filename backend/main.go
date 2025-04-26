package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/boat-builder/agentpod"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/hhsecond/windsurfhackathon/backend/handlers"
)

func main() {
	// Create a new Echo instance
	e := echo.New()

	fmt.Println(os.Getenv("KEYWORDSAI_API_KEY"))
	fmt.Println(os.Getenv("KEYWORDSAI_ENDPOINT"))

	llm := agentpod.NewLLM(
		os.Getenv("KEYWORDSAI_API_KEY"),
		os.Getenv("KEYWORDSAI_ENDPOINT"),
		"azure/o3",
		"azure/gpt-4o",
		"azure/o1-mini",
		"azure/gpt-4o-mini",
	)
	fmt.Println(llm.GenerationModel)

	// Enable CORS
	e.Use(middleware.CORS())

	// Define routes
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	// Register conversational-keywords handler
	e.POST("/analyze", func(c echo.Context) error {
		return handlers.HandleConversationalKeywords(c, llm)
	})

	// Start the server
	e.Logger.Fatal(e.Start(":8080"))
}
