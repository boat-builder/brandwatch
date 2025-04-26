'use client';

import { useMutation } from '@tanstack/react-query';
import { keywordService } from '../services/keywordService';
import { ConversationalKeywordsRequest } from '../types';

/**
 * Hook for getting conversational keywords for topics
 */
export function useConversationalKeywords() {
  return useMutation({
    mutationFn: (data: ConversationalKeywordsRequest) => 
      keywordService.getConversationalKeywords(data),
    mutationKey: ['conversational-keywords'],
  });
}
