import React from 'react';
import { ReaderSettings as ReaderSettingsType } from '../types';
import { 
  Type, 
  AlignJustify, 
  Sun, 
  Moon, 
  Coffee, 
  Minus, 
  Plus, 
  RotateCcw
} from 'lucide-react';

interface ReaderSettingsProps {
  settings: ReaderSettingsType;
  onSettingsChange: (settings: ReaderSettingsType) => void;
  onClose: () => void;
}

const ReaderSettings: React.FC<ReaderSettingsProps> = ({ 
  settings, 
  onSettingsChange, 
  onClose 
}) => {
  const handleFontSizeChange = (delta: number) => {
    try {
      const newSize = Math.max(50, Math.min(200, settings.fontSize + delta));
      onSettingsChange({ ...settings, fontSize: newSize });
    } catch (error) {
      console.error('Error changing font size:', error);
    }
  };

  const handleLineHeightChange = (delta: number) => {
    try {
      const newLineHeight = Math.max(1, Math.min(3, Number((settings.lineHeight + delta).toFixed(1))));
      onSettingsChange({ ...settings, lineHeight: newLineHeight });
    } catch (error) {
      console.error('Error changing line height:', error);
    }
  };

  const handleThemeChange = (theme: 'light' | 'sepia' | 'dark') => {
    try {
      onSettingsChange({ ...settings, theme });
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  };

  const resetToDefaults = () => {
    try {
      onSettingsChange({
        fontSize: 100,
        fontFamily: 'serif',
        lineHeight: 1.5,
        theme: 'light',
        margin: 20
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Font Size */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Type className="w-4 h-4 mr-2" />
            Font Size
          </label>
          <span className="text-sm text-gray-500">{settings.fontSize}%</span>
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => handleFontSizeChange(-10)}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Decrease font size"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="flex-1 mx-2 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-blue-500 rounded-full" 
              style={{ width: `${(settings.fontSize - 50) / 1.5}%` }}
            />
          </div>
          <button 
            onClick={() => handleFontSizeChange(10)}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Increase font size"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Line Height */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <AlignJustify className="w-4 h-4 mr-2" />
            Line Spacing
          </label>
          <span className="text-sm text-gray-500">{settings.lineHeight.toFixed(1)}</span>
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => handleLineHeightChange(-0.1)}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Decrease line height"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="flex-1 mx-2 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-blue-500 rounded-full" 
              style={{ width: `${((settings.lineHeight - 1) / 2) * 100}%` }}
            />
          </div>
          <button 
            onClick={() => handleLineHeightChange(0.1)}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Increase line height"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
        <div className="flex space-x-2">
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex-1 p-3 rounded-md flex flex-col items-center ${
              settings.theme === 'light' 
                ? 'bg-blue-100 border-2 border-blue-500' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Sun className="w-5 h-5 mb-1" />
            <span className="text-xs">Light</span>
          </button>
          <button
            onClick={() => handleThemeChange('sepia')}
            className={`flex-1 p-3 rounded-md flex flex-col items-center ${
              settings.theme === 'sepia' 
                ? 'bg-blue-100 border-2 border-blue-500' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            style={{ backgroundColor: settings.theme === 'sepia' ? '#f8f1e3' : '' }}
          >
            <Coffee className="w-5 h-5 mb-1" />
            <span className="text-xs">Sepia</span>
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex-1 p-3 rounded-md flex flex-col items-center ${
              settings.theme === 'dark' 
                ? 'bg-gray-700 border-2 border-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Moon className="w-5 h-5 mb-1" />
            <span className="text-xs">Dark</span>
          </button>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetToDefaults}
        className="flex items-center justify-center w-full p-2 mt-4 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset to Defaults
      </button>
    </div>
  );
};

export default ReaderSettings;