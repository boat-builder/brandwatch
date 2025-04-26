import { apiRequest } from '../apiClient';
import { ConversationalKeywordsRequest, ConversationalKeywordsResponse } from '../types';

export const keywordService = {
  /**
   * Get conversational keywords for topics
   */
  getConversationalKeywords: async (data: ConversationalKeywordsRequest) => {
    return apiRequest<ConversationalKeywordsResponse>('/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
