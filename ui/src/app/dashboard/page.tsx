"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { TopicKeywordPerformance } from "@/components/TopicKeywordPerformance";
import { TopicKeywordData } from "@/types/TopicKeywordData";

// Dummy data for testing - containing only ChatGPT data
const dummyKeywordData: TopicKeywordData[] = [
  {
    id: '1',
    name: 'seo tools',
    searchEngines: {
      'ChatGPT': {
        totalAppearances: 1200,
        distinctBrands: 45,
        totalLinks: 230,
        avgVisibilityPosition: 8.5,
        userLinkAppearances: 15,
        weeklyHistory: [
          { week: '2024-01-01', appearances: 100 },
          { week: '2024-01-08', appearances: 110 },
          { week: '2024-01-15', appearances: 95 },
          { week: '2024-01-22', appearances: 120 },
          { week: '2024-01-29', appearances: 130 },
        ]
      }
    }
  },
  {
    id: '2',
    name: 'keyword research',
    searchEngines: {
      'ChatGPT': {
        totalAppearances: 850,
        distinctBrands: 32,
        totalLinks: 180,
        avgVisibilityPosition: 6.2,
        userLinkAppearances: 8,
        weeklyHistory: [
          { week: '2024-01-01', appearances: 80 },
          { week: '2024-01-08', appearances: 85 },
          { week: '2024-01-15', appearances: 90 },
          { week: '2024-01-22', appearances: 75 },
          { week: '2024-01-29', appearances: 95 },
        ]
      }
    }
  },
  {
    id: '3',
    name: 'content marketing',
    searchEngines: {
      'ChatGPT': {
        totalAppearances: 1500,
        distinctBrands: 52,
        totalLinks: 280,
        avgVisibilityPosition: 7.8,
        userLinkAppearances: 12,
        weeklyHistory: [
          { week: '2024-01-01', appearances: 120 },
          { week: '2024-01-08', appearances: 130 },
          { week: '2024-01-15', appearances: 140 },
          { week: '2024-01-22', appearances: 125 },
          { week: '2024-01-29', appearances: 135 },
        ]
      }
    }
  },
  {
    id: '4',
    name: 'backlink analysis',
    searchEngines: {
      'ChatGPT': {
        totalAppearances: 650,
        distinctBrands: 28,
        totalLinks: 150,
        avgVisibilityPosition: 9.1,
        userLinkAppearances: 6,
        weeklyHistory: [
          { week: '2024-01-01', appearances: 60 },
          { week: '2024-01-08', appearances: 65 },
          { week: '2024-01-15', appearances: 70 },
          { week: '2024-01-22', appearances: 55 },
          { week: '2024-01-29', appearances: 75 },
        ]
      }
    }
  },
  {
    id: '5',
    name: 'rank tracking',
    searchEngines: {
      'ChatGPT': {
        totalAppearances: 950,
        distinctBrands: 38,
        totalLinks: 200,
        avgVisibilityPosition: 5.5,
        userLinkAppearances: 10,
        weeklyHistory: [
          { week: '2024-01-01', appearances: 90 },
          { week: '2024-01-08', appearances: 95 },
          { week: '2024-01-15', appearances: 100 },
          { week: '2024-01-22', appearances: 85 },
          { week: '2024-01-29', appearances: 105 },
        ]
      }
    }
  }
];

export default function Dashboard() {
  const router = useRouter();
  
  const handleReset = () => {
    localStorage.removeItem("brandData");
    router.push("/");
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
            data={dummyKeywordData}
            isLoading={false}
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
