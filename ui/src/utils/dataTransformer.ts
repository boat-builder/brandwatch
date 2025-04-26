import { ConversationalKeywordsResponse } from "@/api/types";
import { TopicKeywordData } from "@/types/TopicKeywordData";

/**
 * Transforms API response data to the format expected by the TopicKeywordPerformance component
 * @param response The API response containing topic/keyword data
 * @returns TopicKeywordData array ready for use in the UI components
 */
export function transformApiResponseToUiFormat(response: ConversationalKeywordsResponse): TopicKeywordData[] {
  console.log('Raw API response:', JSON.stringify(response, null, 2));
  
  if (!response.results || !response.results.length) {
    console.log('No results in API response');
    return [];
  }
  
  console.log(`Processing ${response.results.length} topics from API response`);

  return response.results.map((topic, index) => {
    // Log topic details
    console.log(`Processing topic: ${topic.Topic}`);
    console.log('Topic has search engines:', topic.searchEngines ? 'Yes' : 'No');
    
    // Ensure searchEngines is defined, default to empty object if not
    const searchEngines = topic.searchEngines || {};
    const engineNames = Object.keys(searchEngines);
    console.log('Search engines found:', engineNames);
    
    const transformedData: TopicKeywordData = {
      id: String(index), // Generate unique ID based on index
      name: topic.Topic,
      searchEngines: {}
    };

    // Convert search engine data for each engine
    engineNames.forEach(engineName => {
      const engineData = searchEngines[engineName];
      console.log(`Processing engine: ${engineName}`);
      
      // Check if history exists
      if (!engineData.history || !Array.isArray(engineData.history)) {
        console.error(`Missing or invalid history array for engine ${engineName}:`, engineData);
        // Create empty history array to avoid errors
        engineData.history = [];
      } else {
        console.log(`Engine ${engineName} has ${engineData.history.length} history points`);
      }
      
      transformedData.searchEngines[engineName] = {
        totalAppearances: engineData.totalAppearances || 0,
        distinctBrands: engineData.distinctBrands || 0,
        totalLinks: engineData.totalLinks || 0,
        avgVisibilityPosition: engineData.avgVisibilityPosition || 0,
        userLinkAppearances: engineData.userLinkAppearances || 0,
        history: engineData.history.map(historyPoint => ({
          timepoint: historyPoint.timepoint || '',
          appearances: historyPoint.appearances || 0
        }))
      };
    });

    // If ChatGPT is one of the search engines, set it as the aggregated data
    if (transformedData.searchEngines['ChatGPT']) {
      transformedData.aggregated = transformedData.searchEngines['ChatGPT'];
    } else if (engineNames.length > 0) {
      // Otherwise use the first search engine as aggregated data
      transformedData.aggregated = transformedData.searchEngines[engineNames[0]];
    }

    console.log('Transformed topic data:', transformedData);
    return transformedData;
  });
}
