package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/boat-builder/agentpod"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Create a new Echo instance
	e := echo.New()

	llm := agentpod.NewLLM(
		os.Getenv("KEYWORDSAI_API_KEY"),
		os.Getenv("KEYWORDSAI_ENDPOINT"),
		"o1",
		"gpt-4o",
		"o1-mini",
		"gpt-4o-mini",
	)
	fmt.Println(llm.GenerationModel)

	// Define request and response structures
type ConversationalKeywordsRequest struct {
	Domain string   `json:"domain"`
	Topics []string `json:"topics"`
}

type ConversationalKeywordTopic struct {
	Topic                 string   `json:"Topic"`
	ConversationalKeywords []string `json:"ConversationalKeywords"`
}

type ConversationalKeywordsResponse struct {
	Results []ConversationalKeywordTopic `json:"results"`
}

// Enable CORS
e.Use(middleware.CORS())

// Define routes
e.GET("/", func(c echo.Context) error {
	return c.String(http.StatusOK, "ok")
})

e.POST("/conversational-keywords", func(c echo.Context) error {
	// Parse request body
	var request ConversationalKeywordsRequest
	if err := c.Bind(&request); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request format"})
	}

	// Validate request
	if len(request.Topics) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "No topics provided"})
	}

	// Prepare response
	response := ConversationalKeywordsResponse{
		Results: make([]ConversationalKeywordTopic, 0, len(request.Topics)),
	}

	// Process each topic and generate dummy conversational keywords
	for _, topic := range request.Topics {
		result := ConversationalKeywordTopic{
			Topic: topic,
			ConversationalKeywords: []string{
				"how to " + topic,
				"best " + topic + " methods",
				"why is " + topic + " important",
				"when to use " + topic,
				"can you explain " + topic,
			},
		}
		response.Results = append(response.Results, result)
	}

	return c.JSON(http.StatusOK, response)
})

// Start the server
e.Logger.Fatal(e.Start(":8080"))
}
