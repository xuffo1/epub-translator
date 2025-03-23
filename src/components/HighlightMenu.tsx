import React from 'react';
import { HIGHLIGHT_COLORS } from '../types';
import { Copy } from 'lucide-react';

interface HighlightMenuProps {
  onHighlight: (color: string) => void;
  onCopy: () => void;
  onSearch: () => void;
  position: { x: number, y: number };
}

const HighlightMenu: React.FC<HighlightMenuProps> = ({ 
  onHighlight, 
  onCopy,
  position 
}) => {
  return (
    <div 
      className="fixed bg-white rounded-lg shadow-xl p-3 z-50 flex flex-col gap-3"
      style={{
        top: `${position.y + 10}px`,
        left: `${position.x - 75}px`, // Center the menu
        width: '150px'
      }}
    >
      <button
        onClick={onCopy}
        className="p-2 rounded-md hover:bg-gray-100 text-gray-700 flex items-center text-sm"
      >
        <Copy size={16} className="mr-1" />
        Copy
      </button>
      
      <div className="flex justify-between">
        {HIGHLIGHT_COLORS.map(color => (
          <button
            key={color.id}
            onClick={() => onHighlight(color.value)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ backgroundColor: color.value }}
            aria-label={`Highlight with ${color.id} color`}
          />
        ))}
      </div>
    </div>
  );
};

export default HighlightMenu;