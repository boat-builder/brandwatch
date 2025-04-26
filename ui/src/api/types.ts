// API types for the conversational keywords endpoint

// Request type for conversational keywords
export interface ConversationalKeywordsRequest {
  domain: string;
  description: string;
  topics: string[];
}

// KeywordWithIntent defines a structure for keyword with its intent
export interface KeywordWithIntent {
  keyword: string;
  intent: string;
}

// Response type for conversational keywords
export interface TopicKeywords {
  Topic: string;
  ConversationalKeywords: KeywordWithIntent[];
}

export interface ConversationalKeywordsResponse {
  results: TopicKeywords[];
}
