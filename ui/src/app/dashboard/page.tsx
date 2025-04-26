"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TopicKeywordPerformance } from "@/components/TopicKeywordPerformance";
import { TopicKeywordData } from "@/types/TopicKeywordData";
import { transformApiResponseToUiFormat } from "@/utils/dataTransformer";
import { ConversationalKeywordsResponse, ConversationalKeywordTopic } from "@/api/types";
import { useConversationalKeywords } from "@/api/hooks/useConversationalKeywords";

export default function Dashboard() {
  const router = useRouter();
  const [keywordData, setKeywordData] = useState<TopicKeywordData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [domain, setDomain] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  
  // Initialize the mutation hook for API calls
  const keywordsMutation = useConversationalKeywords();
  
  // Load data from localStorage on component mount
  useEffect(() => {
    const loadBrandData = () => {
      setIsLoading(true);
      try {
        const storedData = localStorage.getItem("brandData");
        
        if (storedData) {
          const brandData = JSON.parse(storedData);
          setDomain(brandData.domain || "");
          setTopics(brandData.topics || []);
          
          // Transform the API response to the format expected by the TopicKeywordPerformance component
          if (brandData.results && brandData.results.length > 0) {
            const apiResponse: ConversationalKeywordsResponse = {
              results: brandData.results
            };
            
            const transformedData = transformApiResponseToUiFormat(apiResponse);
            setKeywordData(transformedData);
          }
        
        } else {
          // Redirect to home if no data is found
          router.push("/");
        }
      } catch (error) {
        // Error handling
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBrandData();
  }, [router]);
  
  const handleReset = () => {
    localStorage.removeItem("brandData");
    router.push("/");
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    
    try {
      // Get the data from localStorage
      const storedData = localStorage.getItem("brandData");
      if (!storedData) {
        console.error("No brand data found in localStorage");
        setIsLoading(false);
        return;
      }
      
      const brandData = JSON.parse(storedData);
      
      if (!brandData.domain || !brandData.topics || brandData.topics.length === 0) {
        console.error("Missing required data in localStorage");
        setIsLoading(false);
        return;
      }
      
      // Use the existing results data structure with all previously found data
      const formattedTopics = brandData.results ? brandData.results : brandData.topics.map((topic: string) => ({
        Topic: topic,
        ConversationalKeywords: []
      }));

      // Call the analyze endpoint
      const response = await keywordsMutation.mutateAsync({
        domain: brandData.domain,
        topics: formattedTopics
      });
      
      if (response.data?.results) {
        // Check if the response contains valid search engines data
        const hasValidSearchEngines = response.data.results.some(topic => 
          topic.searchEngines && Object.keys(topic.searchEngines).length > 0
        );
        
        if (!hasValidSearchEngines) {
          
          // Merge the new results with existing search engines data
          const mergedResults = response.data.results.map(newTopic => {
            // Find corresponding topic in existing data
            const existingTopic = brandData.results?.find((t: ConversationalKeywordTopic) => t.Topic === newTopic.Topic);
            
            if (existingTopic && existingTopic.searchEngines) {
              return {
                ...newTopic,
                searchEngines: existingTopic.searchEngines
              };
            }
            
            return newTopic;
          });
          
          // Save the merged data to localStorage
          const updatedBrandData = {
            domain: brandData.domain,
            topics: brandData.topics,
            results: mergedResults
          };
          localStorage.setItem("brandData", JSON.stringify(updatedBrandData));
          
          // Transform the merged data and update state
          const transformedData = transformApiResponseToUiFormat({ results: mergedResults });
          setKeywordData(transformedData);
        } else {
          // Save the updated data to localStorage (normal flow)
          const updatedBrandData = {
            domain: brandData.domain,
            topics: brandData.topics,
            results: response.data.results
          };
          localStorage.setItem("brandData", JSON.stringify(updatedBrandData));
          
          // Transform the API response and update state
          const transformedData = transformApiResponseToUiFormat(response.data);
          setKeywordData(transformedData);
        }
      }
    } catch (error) {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Title bar with subtle blue-yellow gradient */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 via-yellow-50 to-blue-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image 
              src="/arrow.png" 
              alt="Brand Watch Logo" 
              width={36} 
              height={36} 
              className="h-9 w-9" 
            />
            <h1 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-amber-500">
              Brand Watch
            </h1>
            <button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="ml-3 flex items-center text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-700 px-2 py-1 rounded-full shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Get latest data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              {isLoading ? "Updating..." : "Get Latest"}
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors focus:outline-none flex items-center"
              title="Reset and return to home"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Reset
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow p-6 bg-gray-50">
        <div className="container mx-auto space-y-8">
          {/* Topic/Keyword Performance Section */}
          <TopicKeywordPerformance 
            type="topic"
            data={keywordData}
            isLoading={isLoading}
          />
        </div>
      </main>

      <footer className="py-6 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Brand Watch. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
