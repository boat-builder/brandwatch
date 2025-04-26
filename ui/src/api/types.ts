// API types for the conversational keywords endpoint

// Request type for conversational keywords
export interface ConversationalKeywordsRequest {
  domain: string;
  description: string;
  topics: string[];
}

// Response type for conversational keywords
export interface TopicKeywords {
  Topic: string;
  ConversationalKeywords: string[];
}

export interface ConversationalKeywordsResponse {
  results: TopicKeywords[];
}
