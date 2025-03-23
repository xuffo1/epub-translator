import { useState, useCallback, useEffect, useRef } from 'react';
import { translateText, clearTranslationCache, needsTranslation } from '../services/translationService';
import { getTranslationState, saveTranslationState, getTranslatedSection } from '../services/storageService';

export const useTranslation = (bookId: string) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const translationQueue = useRef<Set<string>>(new Set());
  const abortController = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  // Load translation state on mount and cleanup on unmount
  useEffect(() => {
    const loadTranslationState = async () => {
      try {
        const state = await getTranslationState(bookId);
        if (state?.isTranslated && state?.targetLanguage && mounted.current) {
          setTargetLanguage(state.targetLanguage);
          console.log('Restored translation state:', state.targetLanguage);
        }
      } catch (err) {
        console.error('Error loading translation state:', err);
      }
    };

    loadTranslationState();

    // Cleanup function
    return () => {
      mounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
      translationQueue.current.clear();
    };
  }, [bookId]);

  // Handle language change with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const updateTranslationState = async () => {
      if (!mounted.current) return;

      try {
        await saveTranslationState(bookId, {
          isTranslated: Boolean(targetLanguage),
          targetLanguage,
          lastUpdated: Date.now(),
          translatedSections: {}
        });
        console.log('Saved translation state:', targetLanguage);
      } catch (err) {
        console.error('Error saving translation state:', err);
      }
    };

    if (targetLanguage) {
      timeoutId = setTimeout(updateTranslationState, 300);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [targetLanguage, bookId]);

  const translateContent = useCallback(async (
    content: string,
    language: string,
    cfi?: string
  ) => {
    if (!content || !language || !needsTranslation(content)) return content;
    if (!mounted.current) return content;

    const contentKey = cfi || content;

    // Check if this section is already being translated
    if (translationQueue.current.has(contentKey)) {
      console.log('Content already in translation queue:', contentKey);
      return content;
    }

    // Add to translation queue
    translationQueue.current.add(contentKey);
    console.log('Added to translation queue:', contentKey);

    setIsTranslating(true);
    setError(null);

    try {
      // Check if we have a cached translation first
      if (cfi) {
        const cachedTranslation = await getTranslatedSection(bookId, cfi);
        if (cachedTranslation) {
          console.log('Using cached translation for:', cfi);
          return cachedTranslation;
        }
      }

      // Create new abort controller for this translation
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      console.log('Starting translation for:', contentKey);
      const result = await translateText(
        content,
        language,
        bookId,
        cfi,
        abortController.current.signal
      );

      if (!mounted.current) return content;
      return result.translatedText;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Translation aborted for:', contentKey);
        return content;
      }
      console.error('Translation error:', err);
      setError('Translation failed. Please try again.');
      return content;
    } finally {
      if (mounted.current) {
        setIsTranslating(false);
      }
      translationQueue.current.delete(contentKey);
      console.log('Removed from translation queue:', contentKey);
    }
  }, [bookId]);

  const clearTranslation = useCallback(async () => {
    if (!mounted.current) return;

    console.log('Clearing translation state');
    
    // Abort any ongoing translations
    if (abortController.current) {
      abortController.current.abort();
    }

    setTargetLanguage('');
    clearTranslationCache();
    translationQueue.current.clear();
    
    try {
      // Update translation state
      await saveTranslationState(bookId, {
        isTranslated: false,
        targetLanguage: '',
        lastUpdated: Date.now(),
        translatedSections: {}
      });
      console.log('Translation state cleared');
    } catch (err) {
      console.error('Error clearing translation state:', err);
    }
  }, [bookId]);

  const isTranslationEnabled = useCallback(() => {
    return Boolean(targetLanguage);
  }, [targetLanguage]);

  return {
    isTranslating,
    targetLanguage,
    error,
    translateContent,
    setTargetLanguage,
    clearTranslation,
    isTranslationEnabled
  };
};