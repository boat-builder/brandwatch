"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useConversationalKeywords } from "@/api/hooks/useConversationalKeywords";
import { TopicKeywords } from "@/api/types";

export default function Home() {
  const [domain, setDomain] = useState("");
  const [topics, setTopics] = useState([""]);
  const [results, setResults] = useState<TopicKeywords[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const keywordsMutation = useConversationalKeywords();
  const router = useRouter();
  
  // Check if data exists in localStorage and redirect to dashboard
  useEffect(() => {
    const storedData = localStorage.getItem("brandData");
    if (storedData) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDomain(e.target.value);
  };

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  const addTopicField = () => {
    setTopics([...topics, ""]);
  };

  const removeTopicField = (index: number) => {
    if (topics.length > 1) {
      const newTopics = [...topics];
      newTopics.splice(index, 1);
      setTopics(newTopics);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResults(null);
    
    // Filter out empty topics
    const filteredTopics = topics.filter(topic => topic.trim() !== "");
    
    if (domain && filteredTopics.length > 0) {
      try {
        const response = await keywordsMutation.mutateAsync({
          domain,
          description: "", // Empty description as requested
          topics: filteredTopics
        });
        
        if (response.data?.results) {
          // Save data to localStorage
          const brandData = {
            domain,
            topics: filteredTopics,
            results: response.data.results
          };
          localStorage.setItem("brandData", JSON.stringify(brandData));
          
          // Redirect to dashboard
          router.push("/dashboard");
        } else if (response.error) {
          setError(response.error.message);
        }
      } catch (err) {
        setError("Failed to optimize your brand performance. Please try again.");
        console.error("Error:", err);
      } finally {
        setIsSubmitting(false);
      }
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
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow container mx-auto p-6 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-amber-500">
              Get Inbound Leads from AI Search
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your brand&apos;s domain and the topics you want to rank for in AI search engines
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Domain input - larger and more prominent */}
            <div className="space-y-4">
              <label className="block text-lg font-medium text-gray-700">
                Your Brand&apos;s Domain
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={domain}
                  onChange={handleDomainChange}
                  placeholder="example.com"
                  className="w-full text-xl py-4 px-6 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Topics to rank for */}
            <div className="space-y-4">
              <label className="block text-lg font-medium text-gray-700">
                Topics to Rank For in AI Search
              </label>
              <div className="space-y-3">
                {topics.map((topic, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => handleTopicChange(index, e.target.value)}
                      placeholder={`Topic ${index + 1}`}
                      className="flex-grow py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required={index === 0}
                    />
                    {topics.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTopicField(index)}
                        className="p-2 text-red-500 hover:text-red-700 focus:outline-none"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTopicField}
                  className="flex items-center text-blue-600 hover:text-blue-800 focus:outline-none transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Add Another Topic
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-amber-500 hover:from-blue-700 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Optimizing..." : "Optimize Your Brand Performance"}
              </button>
            </div>
          </form>
          
          {/* Error message */}
          {error && (
            <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-xl">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          {/* Results display */}
          {results && results.length > 0 && (
            <div className="mt-8 space-y-6">
              <h3 className="text-2xl font-bold text-gray-800">Conversational Keywords</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((result, index) => (
                  <div key={index} className="bg-gradient-to-br from-blue-50 to-amber-50 p-6 rounded-xl shadow-sm">
                    <h4 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-amber-500">
                      {result.Topic}
                    </h4>
                    <ul className="space-y-2">
                      {result.ConversationalKeywords.map((keyword, keywordIndex) => (
                        <li key={keywordIndex} className="flex items-start">
                          <span className="mr-2 text-blue-500">•</span>
                          <span className="text-gray-700">{keyword}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-50 via-yellow-50 to-blue-50 py-4">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          Brand Watch - Get inbound leads from AI Search © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
