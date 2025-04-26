package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/boat-builder/agentpod"
	"github.com/labstack/echo/v4"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/packages/param"
	"github.com/openai/openai-go/responses"
	"github.com/openai/openai-go/shared"
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

// SearchEngineStatsParserStruct used for getting the SearchEngineStats from the openai
type SearchEngineStatsParserStruct struct {
	HasBrandAppeared      bool    `json:"hasBrandAppeared" jsonschema_description:"Has the given brand / domain appeared in the given search result"`
	DistinctBrands        int     `json:"distinctBrands" jsonschema_description:"Number of distinct brands / domains in the given search result"`
	AvgVisibilityPosition float64 `json:"avgVisibilityPosition" jsonschema_description:"Average visibility position of the given brand / domain in the given search result"`
}

// SearchEngineStats represents statistics for a single search engine
type SearchEngineStats struct {
	TotalAppearances      int            `json:"totalAppearances"`
	DistinctBrands        int            `json:"distinctBrands"`
	AvgVisibilityPosition float64        `json:"avgVisibilityPosition"`
	History               []HistoryPoint `json:"history"`
}

// ConversationalKeywordTopic defines the structure for each topic's result
type ConversationalKeywordTopic struct {
	Topic                  string                       `json:"Topic"`
	ConversationalKeywords []KeywordWithIntent          `json:"ConversationalKeywords"`
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

func getSearchEngineStats(llm *agentpod.LLM, response string) (SearchEngineStatsParserStruct, error) {
	schemaParam := openai.ResponseFormatJSONSchemaJSONSchemaParam{
		Name:        "searchEngineStats",
		Description: openai.String("Statistics about the search engine results"),
		Schema:      agentpod.GenerateSchema[SearchEngineStatsParserStruct](),
		Strict:      openai.Bool(true),
	}
	params := openai.ChatCompletionNewParams{
		Messages: []openai.ChatCompletionMessageParamUnion{openai.DeveloperMessage("anaylze the response from previous search result and find out the stats user is looking for"), openai.UserMessage(response)},
		Model:    llm.GenerationModel,
		ResponseFormat: openai.ChatCompletionNewParamsResponseFormatUnion{
			OfJSONSchema: &openai.ResponseFormatJSONSchemaParam{
				JSONSchema: schemaParam,
			},
		},
	}
	result, err := llm.New(context.Background(), params)
	if err != nil {
		return SearchEngineStatsParserStruct{}, err
	}

	var searchEngineStats SearchEngineStatsParserStruct
	if err := json.Unmarshal([]byte(result.Choices[0].Message.Content), &searchEngineStats); err != nil {
		return SearchEngineStatsParserStruct{}, err
	}

	return searchEngineStats, nil
}

func searchKeyword(llm *agentpod.LLM, keyword string) (SearchEngineStats, error) {
	// Create test parameters for the Response API
	params := responses.ResponseNewParams{
		Model: shared.ResponsesModel("gpt-4o"),
		Input: responses.ResponseNewParamsInputUnion{
			OfString: param.Opt[string]{Value: keyword},
		},
		Tools: []responses.ToolUnionParam{
			{
				OfWebSearch: &responses.WebSearchToolParam{
					Type: responses.WebSearchToolTypeWebSearchPreview,
				},
			},
		},
		ToolChoice: responses.ResponseNewParamsToolChoiceUnion{
			OfHostedTool: &responses.ToolChoiceTypesParam{
				Type: responses.ToolChoiceTypesTypeWebSearchPreview,
			},
		},
	}

	// Call the NewResponse function
	response, err := llm.NewResponse(context.Background(), params)
	if err != nil {
		return SearchEngineStats{}, err
	}

	// Basic validation of the response
	if response == nil {
		return SearchEngineStats{}, errors.New("expected non-nil response")
	}

	// Check if the response contains the expected content
	// Note: The actual content will depend on the model's response
	if response.OutputText() == "" {
		return SearchEngineStats{}, errors.New("expected non-empty response content")
	}

	// Get stats from the response text
	parserStruct, err := getSearchEngineStats(llm, response.OutputText())
	if err != nil {
		return SearchEngineStats{}, err
	}

	// Convert SearchEngineStatsParserStruct to SearchEngineStats
	// Convert bool to int for TotalAppearances
	totalAppearances := 0
	if parserStruct.HasBrandAppeared {
		totalAppearances = 1
	}

	return SearchEngineStats{
		TotalAppearances:      totalAppearances,
		DistinctBrands:        parserStruct.DistinctBrands,
		AvgVisibilityPosition: parserStruct.AvgVisibilityPosition,
		History:               []HistoryPoint{}, // Initialize with empty history as it's not part of the parser struct
	}, nil
}

func generateChatGPTSearchStats(topicStruct ConversationalKeywordTopic, llm *agentpod.LLM) SearchEngineStats {
	// Get all keywords from the topic
	keywords := make([]string, 0, len(topicStruct.ConversationalKeywords))
	for _, kw := range topicStruct.ConversationalKeywords {
		keywords = append(keywords, kw.Keyword)
	}

	// If no keywords, return empty stats
	if len(keywords) == 0 {
		return SearchEngineStats{
			History: []HistoryPoint{},
		}
	}

	// Create a wait group to wait for all goroutines to finish
	var wg sync.WaitGroup
	// Create a mutex to protect shared data access
	var mu sync.Mutex
	// Channel to collect results from all goroutines
	resultChan := make(chan SearchEngineStats, len(keywords))
	// Channel to track errors
	errChan := make(chan error, len(keywords))

	// Launch a goroutine for each keyword
	for _, keyword := range keywords {
		wg.Add(1)
		go func(kw string) {
			defer wg.Done()

			// Call searchKeyword for this keyword
			stats, err := searchKeyword(llm, kw)
			if err != nil {
				mu.Lock()
				errChan <- err
				mu.Unlock()
				return
			}

			// Send the result to the channel
			mu.Lock()
			resultChan <- stats
			mu.Unlock()
		}(keyword)
	}

	// Close channels when all goroutines are done
	go func() {
		wg.Wait()
		close(resultChan)
		close(errChan)
	}()

	// Aggregate results
	aggregatedStats := SearchEngineStats{
		History: []HistoryPoint{},
	}

	// Get existing history from topicStruct if it exists
	if chatGPTStats, exists := topicStruct.SearchEngines["ChatGPT"]; exists && chatGPTStats.History != nil {
		// Copy existing history
		aggregatedStats.History = append([]HistoryPoint{}, chatGPTStats.History...)
	}

	// Create a new history point with current time
	newPoint := HistoryPoint{
		Timepoint:   time.Now().Format("2006-01-02 15:04"),
		Appearances: 0, // Will be updated with actual data
	}

	// Count collected results and calculate averages
	resultCount := 0
	totalVisibilitySum := 0.0
	totalAppearancesSum := 0
	totalDistinctBrandsSum := 0

	// Check for errors and collect results
	for err := range errChan {
		fmt.Printf("Error processing keyword: %v\n", err)
	}

	// Process all successful results
	for stats := range resultChan {
		resultCount++
		totalAppearancesSum += stats.TotalAppearances
		totalDistinctBrandsSum += stats.DistinctBrands
		totalVisibilitySum += stats.AvgVisibilityPosition
	}

	// Update the aggregated stats
	if resultCount > 0 {
		// Average the values across all keywords
		aggregatedStats.TotalAppearances = totalAppearancesSum
		aggregatedStats.DistinctBrands = totalDistinctBrandsSum / resultCount
		aggregatedStats.AvgVisibilityPosition = totalVisibilitySum / float64(resultCount)

		// Update the new history point
		newPoint.Appearances = totalAppearancesSum
	}

	// Append the new history point
	aggregatedStats.History = append(aggregatedStats.History, newPoint)

	return aggregatedStats
}

func injectSearchEngineData(response ConversationalKeywordsResponse, llm *agentpod.LLM) ConversationalKeywordsResponse {
	for i := range response.Results {
		// Create the map if it doesn't exist
		if response.Results[i].SearchEngines == nil {
			response.Results[i].SearchEngines = make(map[string]SearchEngineStats)
		}

		response.Results[i].SearchEngines["ChatGPT"] = generateChatGPTSearchStats(response.Results[i], llm)
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
		fmt.Println("Processing topic:", topicData.Topic)
		fmt.Println("conversational keywords:", topicData.ConversationalKeywords)
		fmt.Println("search engines:", topicData.SearchEngines)
		topicResult, err := generateKeywordsForTopic(c, llm, topicData, developerMessage, schemaParam)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		response.Results = append(response.Results, topicResult)
	}

	// Add dummy search engine data before returning
	response = injectSearchEngineData(response, llm)

	return c.JSON(http.StatusOK, response)
}
