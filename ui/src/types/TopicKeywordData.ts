export interface SearchEngineData {
  totalAppearances: number;
  distinctBrands: number;
  totalLinks: number;
  avgVisibilityPosition: number;
  userLinkAppearances: number;
  weeklyHistory: {
    week: string;
    appearances: number;
  }[];
}

export interface TopicKeywordData {
  id: string;
  name: string;
  searchEngines: {
    [engine: string]: SearchEngineData;
  };
  aggregated?: SearchEngineData;
}
