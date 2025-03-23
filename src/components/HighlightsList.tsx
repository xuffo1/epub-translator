import React from 'react';
import { Highlight } from '../types';
import { Highlighter, Trash2 } from 'lucide-react';

interface HighlightsListProps {
  highlights: Highlight[];
  onHighlightClick: (highlight: Highlight) => void;
  onHighlightDelete: (cfi: string) => void;
}

const HighlightsList: React.FC<HighlightsListProps> = ({ 
  highlights, 
  onHighlightClick, 
  onHighlightDelete 
}) => {
  // Sort highlights by creation time (newest first)
  const sortedHighlights = [...highlights].sort((a, b) => b.createdAt - a.createdAt);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (highlights.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Highlighter className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No highlights yet</p>
        <p className="text-sm mt-1">Select text while reading to highlight it</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {sortedHighlights.map((highlight) => (
        <div key={highlight.cfi} className="p-3 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <button
              onClick={() => onHighlightClick(highlight)}
              className="flex-1 text-left"
            >
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2 flex-shrink-0" 
                  style={{ backgroundColor: highlight.color }}
                />
                <span 
                  className="font-medium text-sm line-clamp-2"
                  style={{ backgroundColor: highlight.color + '50' }}
                >
                  {highlight.text}
                </span>
              </div>
              {highlight.chapter && (
                <p className="text-xs text-gray-500 mt-1 ml-6">{highlight.chapter}</p>
              )}
              <p className="text-xs text-gray-400 mt-1 ml-6">{formatDate(highlight.createdAt)}</p>
            </button>
            <button
              onClick={() => onHighlightDelete(highlight.cfi)}
              className="p-1 text-gray-400 hover:text-red-500 ml-2"
              aria-label="Delete highlight"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HighlightsList;