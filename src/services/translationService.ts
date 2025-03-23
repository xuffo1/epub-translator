import { TranslationResult } from '../types';
import { getTranslatedSection, saveTranslatedSection } from './storageService';

// Cache for translation results to avoid unnecessary API calls
const translationCache = new Map<string, { text: string; timestamp: number }>();

// Cache expiration time (24 hours)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

export const translateText = async (
  text: string,
  targetLanguage: string,
  bookId?: string,
  cfi?: string,
  signal?: AbortSignal
): Promise<TranslationResult> => {
  try {
    // Check if the operation was aborted
    if (signal?.aborted) {
      throw new Error('Translation aborted');
    }

    // Check if we have a valid cached translation
    const cacheKey = `${text}_${targetLanguage}`;
    const cachedResult = translationCache.get(cacheKey);
    const now = Date.now();

    if (cachedResult && (now - cachedResult.timestamp) < CACHE_EXPIRATION) {
      console.log('Using in-memory cache for:', cacheKey);
      return {
        translatedText: cachedResult.text,
        sourceLanguage: 'auto',
        targetLanguage
      };
    }

    // If bookId and cfi are provided, check for stored translation
    if (bookId && cfi) {
      const storedTranslation = await getTranslatedSection(bookId, cfi);
      if (storedTranslation) {
        console.log('Using stored translation for:', cfi);
        // Update in-memory cache
        translationCache.set(cacheKey, { text: storedTranslation, timestamp: now });
        return {
          translatedText: storedTranslation,
          sourceLanguage: 'auto',
          targetLanguage
        };
      }
    }

    // Check abort signal again before translation
    if (signal?.aborted) {
      throw new Error('Translation aborted');
    }

    // Simulate API call delay
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, 500);
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Translation aborted'));
        });
      }
    });
    
    // For demo purposes, we'll just append the target language to the text
    // In a real implementation, you would call the Google Translate API
    const mockTranslations: Record<string, (text: string) => string> = {
      en: (text) => `[EN] ${text}`,
      es: (text) => `[ES] ${text} (traducido al español)`,
      fr: (text) => `[FR] ${text} (traduit en français)`,
      de: (text) => `[DE] ${text} (ins Deutsche übersetzt)`,
      it: (text) => `[IT] ${text} (tradotto in italiano)`,
      pt: (text) => `[PT] ${text} (traduzido para português)`,
      ru: (text) => `[RU] ${text} (переведено на русский)`,
      zh: (text) => `[ZH] ${text} (翻译成中文)`,
      ja: (text) => `[JA] ${text} (日本語に翻訳)`,
      ko: (text) => `[KO] ${text} (한국어로 번역)`,
      ar: (text) => `[AR] ${text} (مترجم إلى العربية)`,
    };

    const translationFn = mockTranslations[targetLanguage] || ((t) => t);
    const translatedText = translationFn(text);

    // Check abort signal before caching
    if (signal?.aborted) {
      throw new Error('Translation aborted');
    }

    // Update cache with timestamp
    translationCache.set(cacheKey, { text: translatedText, timestamp: now });
    console.log('Added to translation cache:', cacheKey);

    // If bookId and cfi are provided, store the translation
    if (bookId && cfi) {
      await saveTranslatedSection(bookId, cfi, translatedText);
      console.log('Saved translation for:', cfi);
    }
    
    return {
      translatedText,
      sourceLanguage: 'auto',
      targetLanguage,
    };
  } catch (error) {
    if (error.name === 'AbortError' || error.message === 'Translation aborted') {
      throw new Error('Translation aborted');
    }
    console.error('Translation error:', error);
    throw new Error('Translation failed');
  }
};

// Clear translation cache
export const clearTranslationCache = () => {
  console.log('Clearing translation cache');
  translationCache.clear();
};

// Clean expired cache entries
export const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of translationCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRATION) {
      translationCache.delete(key);
      console.log('Removed expired cache entry:', key);
    }
  }
};

// Auto-clean cache every hour
setInterval(cleanExpiredCache, 60 * 60 * 1000);

// Check if text needs translation
export const needsTranslation = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  
  // Skip translation for very short text
  if (text.length < 2) return false;

  // Skip translation for numbers only
  if (/^\d+$/.test(text)) return false;

  // Skip translation for common punctuation and symbols
  if (/^[.,!?;:'"()\[\]{}\/\\-_+=<>@#$%^&*]+$/.test(text)) return false;

  return (
    /[^\x00-\x7F]/.test(text) || // Contains non-ASCII characters
    /[\u4e00-\u9fff]/.test(text) || // Contains Chinese characters
    /[\u3040-\u30ff]/.test(text) || // Contains Japanese characters
    /[\uac00-\ud7af]/.test(text) || // Contains Korean characters
    /[\u0600-\u06ff]/.test(text) // Contains Arabic characters
  );
};