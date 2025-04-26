"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useDebounce } from "@/hooks/useDebounce";
import { TopicKeywordData } from "@/types/TopicKeywordData";
import { Checkbox } from "@/components/ui/checkbox";

interface TopicKeywordPerformanceProps {
  type: 'topic' | 'keyword';
  data?: TopicKeywordData[];
  isLoading?: boolean;
}

export function TopicKeywordPerformance({
  type,
  data = [],
  isLoading = false,
}: TopicKeywordPerformanceProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Performance`;

  // Process data to use the first available search engine if ChatGPT not available
  const processedData = React.useMemo(() => {
    
    return data.map(item => {
      // Try to get a search engine to use as aggregated data
      let aggregatedData = null;
      
      // First try to use ChatGPT data
      if (item.searchEngines['ChatGPT']) {
        aggregatedData = item.searchEngines['ChatGPT'];
      } 
      // Then try GoogleAI
      else if (item.searchEngines['GoogleAI']) {
        aggregatedData = item.searchEngines['GoogleAI'];
      }
      // Then use the first available search engine
      else {
        const engines = Object.keys(item.searchEngines);
        if (engines.length > 0) {
          aggregatedData = item.searchEngines[engines[0]];
        }
      }
      
      // Fallback to empty data if no engines found
      if (!aggregatedData) {
        aggregatedData = {
          totalAppearances: 0,
          distinctBrands: 0,
          avgVisibilityPosition: 0,
          history: []
        };
      }
      
      
      if (!item.aggregated) {
        console.log(`Adding aggregated data to item ${item.name}`);
      }
      
      return {
        ...item,
        aggregated: aggregatedData
      };
    });
  }, [data]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!debouncedSearchTerm) return processedData;
    return processedData.filter(item => 
      item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [processedData, debouncedSearchTerm]);

  // Paginate filtered data
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  // Auto-select first 5 elements and ensure selectedIds only contains valid IDs
  React.useEffect(() => {
    // Always select all available items if we have 5 or fewer
    if (data.length > 0 && data.length <= 5) {
      const allIds = data.map(item => item.id);
      setSelectedIds(allIds);
      return;
    }
    
    const validIds = new Set(data.map(item => item.id));
    
    setSelectedIds(prev => {
      const currentSelectedIds = prev.filter(id => validIds.has(id));
      
      if (currentSelectedIds.length < 5 && paginatedData.length > 0) {
        const newIds = paginatedData
          .slice(0, 5 - currentSelectedIds.length)
          .map(item => item.id)
          .filter(id => !currentSelectedIds.includes(id));
        
        return [...currentSelectedIds, ...newIds];
      } else {
        return currentSelectedIds;
      }
    });
  }, [data, paginatedData]);

  // Get data for chart
  const chartData = React.useMemo(() => {
    if (!selectedIds.length) {
      return [];
    }
    
    const selectedItems = processedData.filter(item => selectedIds.includes(item.id));
    
    if (selectedItems.length === 0) {
      return [];
    }
    
    // Check if selectedItems have aggregated data
    selectedItems.forEach(item => {
      if (!item.aggregated) {
        console.info('Missing aggregated data for item:', item.name);
      } else if (!item.aggregated.history || !Array.isArray(item.aggregated.history)) {
        console.info('Missing or invalid history array for item:', item.name, item.aggregated);
      }
    });
    
    const allTimepoints = new Set<string>();
    
    selectedItems.forEach(item => {
      if (item.aggregated && item.aggregated.history) {
        item.aggregated.history.forEach(h => allTimepoints.add(h.timepoint));
      }
    });
    
    const sortedTimepoints = Array.from(allTimepoints).sort();
    
    const result = sortedTimepoints.map(timepoint => {
      const timepointData: { [key: string]: number | string } = { timepoint };
      selectedItems.forEach(item => {
        if (item.aggregated && item.aggregated.history) {
          const historyPoint = item.aggregated.history.find(h => h.timepoint === timepoint);
          timepointData[item.name] = historyPoint?.appearances || 0;
        }
      });
      return timepointData;
    });
    
    return result;
  }, [processedData, selectedIds]);

  // Fixed colors for the first 10 items
  const getItemColor = (index: number) => {
    const colors = [
      '#3B82F6', // blue-500
      '#10B981', // emerald-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#14B8A6', // teal-500
      '#F97316', // orange-500
      '#6366F1', // indigo-500
      '#06B6D4', // cyan-500
    ];
    return colors[index % colors.length];
  };

  const toggleItemSelection = (id: string, e?: React.MouseEvent) => {
    if (e) {
      // If triggered by an event, prevent event bubbling
      e.stopPropagation();
    }
    
    setSelectedIds(prev => 
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-5">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 tracking-wide uppercase">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />
          <div className="h-10 bg-gray-100 animate-pulse rounded-lg" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="p-4 sm:p-5">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 tracking-wide uppercase">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-gray-500">
            <p>No {type}s found. Start tracking some {type}s to see their performance here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-md rounded-xl ring-1 ring-black/5 p-4 sm:p-5">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 tracking-wide uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Provider Info */}
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm text-gray-500">Data Source:</span>
          <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            ChatGPT
          </div>
        </div>

        {/* Chart Section */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {selectedIds.length > 0 ? (
              <LineChart 
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="timepoint" 
                  padding={{ left: 20, right: 20 }} 
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {processedData
                  .filter(item => selectedIds.includes(item.id))
                  .map((item, index) => {
                    console.log(`Creating Line for item: ${item.name} with data:`, 
                      item.aggregated?.history || 'No history');
                    return (
                      <Line
                        key={item.id}
                        name={item.name}
                        type="monotone"
                        dataKey={item.name}
                        stroke={getItemColor(index)}
                        strokeWidth={1}
                        dot={false}
                        activeDot={false}
                        isAnimationActive={true}
                      />
                    );
                  })}
              </LineChart>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-sm">
                  Select {type}s from the table below to visualize their performance
                </p>
              </div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder={`Search ${type}s...`}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full"
          />
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4 text-sm font-normal text-gray-500">{type === 'topic' ? 'Topic' : 'Keyword'}</th>
                <th className="text-left py-2 px-4 text-sm font-normal text-gray-500">Appearances</th>
                <th className="text-left py-2 px-4 text-sm font-normal text-gray-500">Appeared Position</th>
                <th className="text-left py-2 px-4 text-sm font-normal text-gray-500">Total Brands Appeared</th>
                <th className="text-center py-2 px-4 text-sm font-normal text-gray-500">Shown In Graph</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr 
                  key={item.id} 
                  className="border-b hover:bg-gray-50/30 transition-colors"
                >
                  <td className="py-2 px-4 text-sm">{item.name}</td>
                  <td className="py-2 px-4 text-sm">{item.aggregated.totalAppearances}</td>
                  <td className="py-2 px-4 text-sm">{item.aggregated.avgVisibilityPosition.toFixed(1)}</td>
                  <td className="py-2 px-4 text-sm">{item.aggregated.distinctBrands}</td>
                  <td className="py-2 px-4 text-sm text-center">
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                      className="mx-auto"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 