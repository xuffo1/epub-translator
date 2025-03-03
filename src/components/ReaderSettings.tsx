import React from 'react';
import { ReaderSettings as ReaderSettingsType, FONT_FAMILIES } from '../types';
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
    const newSize = Math.max(50, Math.min(200, settings.fontSize + delta));
    onSettingsChange({ ...settings, fontSize: newSize });
  };

  const handleLineHeightChange = (delta: number) => {
    const newLineHeight = Math.max(1, Math.min(3, settings.lineHeight + delta));
    onSettingsChange({ ...settings, lineHeight: newLineHeight });
  };

  const handleMarginChange = (delta: number) => {
    const newMargin = Math.max(0, Math.min(40, settings.margin + delta));
    onSettingsChange({ ...settings, margin: newMargin });
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingsChange({ ...settings, fontFamily: e.target.value });
  };

  const handleThemeChange = (theme: 'light' | 'sepia' | 'dark') => {
    onSettingsChange({ ...settings, theme });
  };

  const resetToDefaults = () => {
    onSettingsChange({
      fontSize: 100,
      fontFamily: 'serif',
      lineHeight: 1.5,
      theme: 'light',
      margin: 20
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Display Settings</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

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
              ></div>
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

        {/* Font Family */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Type className="w-4 h-4 mr-2" />
            Font Family
          </label>
          <select
            value={settings.fontFamily}
            onChange={handleFontFamilyChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
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
                style={{ width: `${(settings.lineHeight - 1) / 0.02}%` }}
              ></div>
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

        {/* Margins */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Margins
            </label>
            <span className="text-sm text-gray-500">{settings.margin}%</span>
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => handleMarginChange(-5)}
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
              aria-label="Decrease margins"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 mx-2 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-blue-500 rounded-full" 
                style={{ width: `${settings.margin * 2.5}%` }}
              ></div>
            </div>
            <button 
              onClick={() => handleMarginChange(5)}
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
              aria-label="Increase margins"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
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
    </div>
  );
};

export default ReaderSettings;