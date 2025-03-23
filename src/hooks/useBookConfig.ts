import { useState, useEffect, useCallback } from 'react';
import { BookConfig, ReaderSettings } from '../types';
import { getBookConfig, saveBookConfig } from '../services/storageService';

export const useBookConfig = (bookId: string, language: string = 'original') => {
  const [config, setConfig] = useState<BookConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load book configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const { original, translated } = await getBookConfig(bookId, language);
        setConfig(language === 'original' ? original : translated || original);
      } catch (err) {
        console.error('Error loading book config:', err);
        setError('Failed to load book configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [bookId, language]);

  // Update configuration
  const updateConfig = useCallback(async (updates: Partial<BookConfig>) => {
    try {
      if (!config) return;

      const updatedConfig = {
        ...config,
        ...updates,
        lastAccessed: Date.now()
      };

      await saveBookConfig(bookId, language, updatedConfig);
      setConfig(updatedConfig);
    } catch (err) {
      console.error('Error updating book config:', err);
      setError('Failed to update book configuration');
    }
  }, [bookId, language, config]);

  // Update reader settings
  const updateSettings = useCallback(async (settings: ReaderSettings) => {
    await updateConfig({ settings });
  }, [updateConfig]);

  return {
    config,
    loading,
    error,
    updateConfig,
    updateSettings
  };
};