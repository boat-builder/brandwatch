'use client';

import { FormEvent, useState } from 'react';
import { useConversationalKeywords } from '@/api/hooks/useConversationalKeywords';
import { ConversationalKeywordsRequest, ConversationalKeywordsResponse, TopicKeywords } from '@/api/types';

export default function KeywordForm() {
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [topics, setTopics] = useState<string[]>(['']);
  const [results, setResults] = useState<ConversationalKeywordsResponse | null>(null);

  const keywordsMutation = useConversationalKeywords();

  const addTopic = () => {
    setTopics([...topics, '']);
  };

  const removeTopic = (index: number) => {
    if (topics.length > 1) {
      const newTopics = [...topics];
      newTopics.splice(index, 1);
      setTopics(newTopics);
    }
  };

  const updateTopic = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Filter out empty topics
    const filteredTopics = topics.filter(topic => topic.trim() !== '');
    
    if (domain && description && filteredTopics.length > 0) {
      const data: ConversationalKeywordsRequest = {
        domain,
        description,
        topics: filteredTopics
      };
      
      try {
        const response = await keywordsMutation.mutateAsync(data);
        setResults(response.data || null);
      } catch (error) {
        console.error('Error fetching conversational keywords:', error);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-yellow-300 bg-clip-text text-transparent">
        Brand Watch Keyword Generator
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
            Domain
          </label>
          <input
            type="text"
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Business Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your business..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topics
          </label>
          {topics.map((topic, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => updateTopic(index, e.target.value)}
                placeholder={`Topic ${index + 1}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => removeTopic(index)}
                className="ml-2 px-3 py-2 text-red-600 hover:text-red-800"
                disabled={topics.length <= 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTopic}
            className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
          >
            Add Topic
          </button>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-yellow-400 text-white font-medium py-2 px-4 rounded-md hover:opacity-90 transition"
            disabled={keywordsMutation.isPending}
          >
            {keywordsMutation.isPending ? 'Generating Keywords...' : 'Generate Keywords'}
          </button>
        </div>
      </form>
      
      {keywordsMutation.isError && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-md">
          Error: {keywordsMutation.error?.message || 'Something went wrong'}
        </div>
      )}
      
      {results && results.results && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Conversational Keywords</h3>
          {results.results.map((result: TopicKeywords, index: number) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium text-lg mb-2">{result.Topic}</h4>
              <ul className="list-disc pl-5 space-y-1">
                {result.ConversationalKeywords.map((keyword: string, idx: number) => (
                  <li key={idx} className="text-gray-700">{keyword}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
