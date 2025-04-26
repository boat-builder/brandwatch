// API types for the conversational keywords endpoint

// KeywordWithIntent defines a structure for keyword with its intent
export interface KeywordWithIntent {
  keyword: string;
  intent: string;
}

// ConversationalKeywordTopic defines the structure for each topic's result
export interface ConversationalKeywordTopic {
  Topic: string;
  ConversationalKeywords: KeywordWithIntent[];
}

// Request type for conversational keywords
export interface ConversationalKeywordsRequest {
  domain: string;
  topics: ConversationalKeywordTopic[];
}

// Response type for conversational keywords
export interface ConversationalKeywordsResponse {
  results: ConversationalKeywordTopic[];
}
