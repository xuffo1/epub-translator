import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { LANGUAGES, LanguageOption, TranslationResult } from '../types';
import { translateText } from '../services/translationService';

interface TranslationPanelProps {
  text: string;
  onClose: () => void;
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({ text, onClose }) => {
  const [targetLanguage, setTargetLanguage] = useState<LanguageOption>(LANGUAGES[0]);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (text) {
      handleTranslate();
    }
  }, [text, targetLanguage]);

  const handleTranslate = async () => {
    if (!text) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await translateText(text, targetLanguage.code);
      setTranslationResult(result);
    } catch (err) {
      setError('Translation failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-lg p-4 max-h-[40vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Translation</h3>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Original Text
        </label>
        <div className="p-3 bg-gray-50 rounded-md text-sm">
          {text}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Translate to
        </label>
        <select
          value={targetLanguage.code}
          onChange={(e) => {
            const selected = LANGUAGES.find(lang => lang.code === e.target.value);
            if (selected) setTargetLanguage(selected);
          }}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Translation
        </label>
        <div className="p-3 bg-gray-50 rounded-md text-sm min-h-[60px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin mr-2" size={16} />
              <span>Translating...</span>
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : translationResult ? (
            translationResult.translatedText
          ) : (
            <span className="text-gray-400">Translation will appear here</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslationPanel;