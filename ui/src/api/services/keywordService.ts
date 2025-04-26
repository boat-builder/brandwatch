import { apiRequest } from '../apiClient';
import { ConversationalKeywordsRequest, ConversationalKeywordsResponse } from '../types';

export const keywordService = {
  /**
   * Get conversational keywords for topics
   */
  getConversationalKeywords: async (data: ConversationalKeywordsRequest) => {
    return apiRequest<ConversationalKeywordsResponse>('/conversational-keywords', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
