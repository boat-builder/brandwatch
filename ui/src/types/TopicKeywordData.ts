export interface SearchEngineData {
  totalAppearances: number;
  distinctBrands: number;
  avgVisibilityPosition: number;
  history: {
    timepoint: string;
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
