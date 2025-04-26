package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/boat-builder/agentpod"
	"github.com/labstack/echo/v4"
	"github.com/openai/openai-go"
)

// ConversationalKeywordsRequest defines the request structure for the API
type ConversationalKeywordsRequest struct {
	Domain string   `json:"domain"`
	Topics []string `json:"topics"`
}

// KeywordWithIntent defines a structure for storing keyword with its intent
type KeywordWithIntent struct {
	Keyword string `json:"keyword"`
	Intent  string `json:"intent"`
}

// ConversationalKeywordTopic defines the structure for each topic's result
type ConversationalKeywordTopic struct {
	Topic                  string              `json:"Topic"`
	ConversationalKeywords []KeywordWithIntent `json:"ConversationalKeywords"`
}

// ConversationalKeywordsResponse defines the response structure for the API
type ConversationalKeywordsResponse struct {
	Results []ConversationalKeywordTopic `json:"results"`
}

const generateConversationalKeywordsPrompt = `
Create conversational keywords for SEO by focusing on informational, commercial, and transactional intents based on a given topic. Generate keywords that mimic the conversational style users would employ when interacting with language models, rather than static search engine queries. 

- **Informational Intent:** What information a user might seek about the topic
- **Commercial Intent:** What comparisons or evaluations a user might seek when considering a purchase related to the topic.
- **Transactional Intent:** What expressions a user might use when ready to purchase or commit to a transaction related to the topic.

# Steps

1. **Understand the Topic:** Analyze the provided topic to focus your keyword creation on relevant and meaningful conversations.
2. **Identify Intents:**
   - **Informational Intent:** Craft questions or phrases that imply a need for understanding or learning more about the topic.
   - **Commercial Intent:** Develop queries that suggest a user is in the process of comparing options or considering buying.
   - **Transactional Intent:** Formulate keywords that show the user's readiness to make a purchase or complete a transaction.
3. **Generate Conversational Keywords:** Create 1-5 conversational keywords for each of the three intents.

# Notes

- Ensure that each keyword genuinely reflects a natural question or query a user might have.
- Conversational keywords should mimic the natural language and phrasing users might use in conversational interactions with language models. Adjust the complexity and specificity based on the topic's typical audience.
- Queries you make should not be mentioning or specifically about one or more brands/products if its. Like, for the given topic, how is product a better to product b. 
`

type GeneratedConversationalKeywords struct {
	InformationalIntentKeywords []string `json:"informationalIntentKeywords" jsonschema_description:"Conversational keywords that has informational intent"`
	CommercialIntentKeywords    []string `json:"commercialIntentKeywords" jsonschema_description:"Conversational keywords that has commercial intent"`
	TransactionalIntentKeywords []string `json:"transactionalIntentKeywords" jsonschema_description:"Conversational keywords that has transactional intent"`
}

// HandleConversationalKeywords handles the /conversational-keywords endpoint
func HandleConversationalKeywords(c echo.Context, llm *agentpod.LLM) error {
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

	developerMessage := openai.DeveloperMessage(generateConversationalKeywordsPrompt)
	schemaParam := openai.ResponseFormatJSONSchemaJSONSchemaParam{
		Name:        "conversationalKeywords",
		Description: openai.String("Informational, commercial and transactional intented conversational keywords for the given topic"),
		Schema:      agentpod.GenerateSchema[GeneratedConversationalKeywords](),
		Strict:      openai.Bool(true),
	}

	// Process each topic and generate conversational keywords
	for _, topic := range request.Topics {
		userMessage := openai.UserMessage(fmt.Sprintf("Generate 1-5 conversational keywords for the topic '%s'", topic))
		params := openai.ChatCompletionNewParams{
			Messages: []openai.ChatCompletionMessageParamUnion{developerMessage, userMessage},
			Model:    llm.GenerationModel,
			ResponseFormat: openai.ChatCompletionNewParamsResponseFormatUnion{
				OfJSONSchema: &openai.ResponseFormatJSONSchemaParam{
					JSONSchema: schemaParam,
				},
			},
		}
		result, err := llm.New(c.Request().Context(), params)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		var conversationalKeywords GeneratedConversationalKeywords
		if err := json.Unmarshal([]byte(result.Choices[0].Message.Content), &conversationalKeywords); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		// Create a combined list of keywords with their intents
		var keywordsWithIntent []KeywordWithIntent

		// Add informational intent keywords
		for _, keyword := range conversationalKeywords.InformationalIntentKeywords {
			keywordsWithIntent = append(keywordsWithIntent, KeywordWithIntent{
				Keyword: keyword,
				Intent:  "informational",
			})
		}

		// Add commercial intent keywords
		for _, keyword := range conversationalKeywords.CommercialIntentKeywords {
			keywordsWithIntent = append(keywordsWithIntent, KeywordWithIntent{
				Keyword: keyword,
				Intent:  "commercial",
			})
		}

		// Add transactional intent keywords
		for _, keyword := range conversationalKeywords.TransactionalIntentKeywords {
			keywordsWithIntent = append(keywordsWithIntent, KeywordWithIntent{
				Keyword: keyword,
				Intent:  "transactional",
			})
		}

		response.Results = append(response.Results, ConversationalKeywordTopic{
			Topic:                  topic,
			ConversationalKeywords: keywordsWithIntent,
		})
	}

	return c.JSON(http.StatusOK, response)
}
