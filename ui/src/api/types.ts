// API types for the conversational keywords endpoint

// KeywordWithIntent defines a structure for keyword with its intent
export interface KeywordWithIntent {
  keyword: string;
  intent: string;
}

// HistoryPoint represents historical data for appearances across time
export interface HistoryPoint {
  timepoint: string;
  appearances: number;
}

// SearchEngineStats represents statistics for a single search engine
export interface SearchEngineStats {
  totalAppearances: number;
  distinctBrands: number;
  totalLinks: number;
  avgVisibilityPosition: number;
  userLinkAppearances: number;
  history: HistoryPoint[];
}

// ConversationalKeywordTopic defines the structure for each topic's result
export interface ConversationalKeywordTopic {
  Topic: string;
  ConversationalKeywords: KeywordWithIntent[];
  searchEngines?: { [key: string]: SearchEngineStats };
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
