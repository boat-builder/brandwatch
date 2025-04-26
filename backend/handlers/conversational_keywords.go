package handlers

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/boat-builder/agentpod"
	"github.com/labstack/echo/v4"
	"github.com/openai/openai-go"
)

// ConversationalKeywordsRequest defines the request structure for the API
type ConversationalKeywordsRequest struct {
	Domain string                       `json:"domain"`
	Topics []ConversationalKeywordTopic `json:"topics"`
}

// KeywordWithIntent defines a structure for storing keyword with its intent
type KeywordWithIntent struct {
	Keyword string `json:"keyword"`
	Intent  string `json:"intent"`
}

// HistoryPoint represents historical data for a specific time point (hourly, daily, or weekly)
type HistoryPoint struct {
	Timepoint   string `json:"timepoint"`
	Appearances int    `json:"appearances"`
}

// SearchEngineStats represents statistics for a single search engine
type SearchEngineStats struct {
	TotalAppearances      int            `json:"totalAppearances"`
	DistinctBrands        int            `json:"distinctBrands"`
	TotalLinks            int            `json:"totalLinks"`
	AvgVisibilityPosition float64        `json:"avgVisibilityPosition"`
	UserLinkAppearances   int            `json:"userLinkAppearances"`
	History               []HistoryPoint `json:"history"`
}

// ConversationalKeywordTopic defines the structure for each topic's result
type ConversationalKeywordTopic struct {
	Topic                  string                       `json:"Topic"`
	ConversationalKeywords []KeywordWithIntent         `json:"ConversationalKeywords"`
	SearchEngines          map[string]SearchEngineStats `json:"searchEngines,omitempty"`
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

// generateKeywordsForTopic generates conversational keywords for the given topic if they don't already exist
func generateKeywordsForTopic(ctx echo.Context, llm *agentpod.LLM, topicData ConversationalKeywordTopic, developerMessage openai.ChatCompletionMessageParamUnion, schemaParam openai.ResponseFormatJSONSchemaJSONSchemaParam) (ConversationalKeywordTopic, error) {
	// If conversational keywords already exist for this topic, return it as is
	if len(topicData.ConversationalKeywords) > 0 {
		return topicData, nil
	}

	// If conversational keywords don't exist, generate them
	userMessage := openai.UserMessage(fmt.Sprintf("Generate 1-5 conversational keywords for the topic '%s'", topicData.Topic))
	params := openai.ChatCompletionNewParams{
		Messages: []openai.ChatCompletionMessageParamUnion{developerMessage, userMessage},
		Model:    llm.GenerationModel,
		ResponseFormat: openai.ChatCompletionNewParamsResponseFormatUnion{
			OfJSONSchema: &openai.ResponseFormatJSONSchemaParam{
				JSONSchema: schemaParam,
			},
		},
	}
	result, err := llm.New(ctx.Request().Context(), params)
	if err != nil {
		return ConversationalKeywordTopic{}, err
	}
	
	var conversationalKeywords GeneratedConversationalKeywords
	if err := json.Unmarshal([]byte(result.Choices[0].Message.Content), &conversationalKeywords); err != nil {
		return ConversationalKeywordTopic{}, err
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

	// Create result with generated keywords
	return ConversationalKeywordTopic{
		Topic:                  topicData.Topic,
		ConversationalKeywords: keywordsWithIntent,
		SearchEngines:          topicData.SearchEngines, // Preserve existing search engine stats if any
	}, nil
}

// generateDummyGoogleAIData generates mock data for GoogleAI search engine
func generateDummyGoogleAIData(topic string) SearchEngineStats {
	// Generate some variable data based on topic length to make it seem more random
	topicFactor := float64(len(topic) % 10)
	
	// Create mock history data
	history := make([]HistoryPoint, 5)
	
	// Create data points for the last 5 days
	baseTime := time.Now().AddDate(0, 0, -5)
	baseAppearances := 80 + int(topicFactor)*5
	
	for i := 0; i < 5; i++ {
		timepoint := baseTime.AddDate(0, 0, i).Format("2006-01-02")
		// Generate some variance in the appearances
		apps := baseAppearances + (i * 10) + int(rand.Intn(20))
		history[i] = HistoryPoint{
			Timepoint:   timepoint,
			Appearances: apps,
		}
	}
	
	return SearchEngineStats{
		TotalAppearances:      1000 + int(topicFactor)*50,
		DistinctBrands:        40 + int(topicFactor),
		TotalLinks:            200 + int(topicFactor)*10,
		AvgVisibilityPosition: 7.5 + (topicFactor * 0.2),
		UserLinkAppearances:   10 + int(topicFactor),
		History:               history,
	}
}

// injectDummySearchEngineData adds mock search engine data to each topic in the response
func injectDummySearchEngineData(response ConversationalKeywordsResponse) ConversationalKeywordsResponse {
	// Initialize random seed
	rand.Seed(time.Now().UnixNano())
	
	// Add search engine data to each topic
	for i := range response.Results {
		// Create the map if it doesn't exist
		if response.Results[i].SearchEngines == nil {
			response.Results[i].SearchEngines = make(map[string]SearchEngineStats)
		}
		
		// Add GoogleAI data
		response.Results[i].SearchEngines["GoogleAI"] = generateDummyGoogleAIData(response.Results[i].Topic)
	}
	
	return response
}

// HandleConversationalKeywords handles the /conversational-keywords endpoint
func HandleConversationalKeywords(c echo.Context, llm *agentpod.LLM) error {
	fmt.Println("Request received...")
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

	// Process each topic and generate conversational keywords if needed
	for _, topicData := range request.Topics {
		topicResult, err := generateKeywordsForTopic(c, llm, topicData, developerMessage, schemaParam)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		response.Results = append(response.Results, topicResult)
	}

	// Add dummy search engine data before returning
	response = injectDummySearchEngineData(response)

	return c.JSON(http.StatusOK, response)
}
