import { Book, Bookmark, ReaderSettings, DEFAULT_READER_SETTINGS, Highlight, ReadingProgress, BookConfig } from '../types';
import ePub from 'epubjs';
import localforage from 'localforage';

// Storage keys
const BOOKMARKS_KEY = 'epub_reader_bookmarks';
const HIGHLIGHTS_KEY = 'epub_reader_highlights';
const READER_SETTINGS_KEY = 'epub_reader_settings';
const READING_PROGRESS_KEY = 'epub_reader_progress';
const BOOK_CONFIG_KEY = 'epub_reader_book_config';
const TRANSLATION_STATE_KEY = 'epub_reader_translation_state';

// Initialize localforage instances
const bookStore = localforage.createInstance({
  name: 'epub-reader',
  storeName: 'books'
});

const fileStore = localforage.createInstance({
  name: 'epub-reader',
  storeName: 'files'
});

const coverStore = localforage.createInstance({
  name: 'epub-reader',
  storeName: 'covers'
});

const configStore = localforage.createInstance({
  name: 'epub-reader',
  storeName: 'configs'
});

const translationStore = localforage.createInstance({
  name: 'epub-reader',
  storeName: 'translations'
});

const bookmarkStore = localforage.createInstance({
  name: 'epub-reader',
  storeName: 'bookmarks'
});

const highlightStore = localforage.createInstance({
  name: 'epub-reader',
  storeName: 'highlights'
});

// Initialize storage with fallback options
const initializeStorage = () => {
  localforage.setDriver([
    localforage.INDEXEDDB,
    localforage.WEBSQL,
    localforage.LOCALSTORAGE
  ]).catch(err => {
    console.error('Error initializing storage:', err);
  });
};

// Call initialization
initializeStorage();

// Helper function to safely parse JSON with fallback
const safeJSONParse = (str: string | null, fallback: any = null): any => {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return fallback;
  }
};

// Helper function to safely stringify JSON
const safeJSONStringify = (data: any, fallback: string = '{}'): string => {
  try {
    return JSON.stringify(data);
  } catch (e) {
    console.error('Error stringifying JSON:', e);
    return fallback;
  }
};

// Helper function to safely access storage
const safeStorageGet = (key: string, fallback: any = null): any => {
  try {
    const value = localStorage.getItem(key);
    return safeJSONParse(value, fallback);
  } catch (e) {
    console.error('Error accessing storage:', e);
    return fallback;
  }
};

// Helper function to safely set storage
const safeStorageSet = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, safeJSONStringify(value));
  } catch (e) {
    console.error('Error setting storage:', e);
    // Try to clear some space if storage is full
    try {
      const keysToPreserve = [READING_PROGRESS_KEY, READER_SETTINGS_KEY];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToPreserve.includes(key)) {
          localStorage.removeItem(key);
        }
      }
      // Try setting the item again
      localStorage.setItem(key, safeJSONStringify(value));
    } catch (retryError) {
      console.error('Error retrying storage set:', retryError);
    }
  }
};

// Convert blob URL to base64
const blobToBase64 = async (blobUrl: string): Promise<string> => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting blob to base64:', error);
    throw error;
  }
};

// Extract book metadata with better error handling and fallbacks
export const extractBookMetadata = async (file: ArrayBuffer): Promise<{ title?: string; author?: string; coverUrl?: string }> => {
  let book: any = null;
  try {
    book = ePub(file);
    await book.ready;
    
    const metadata = await book.loaded.metadata;
    let coverUrl = null;

    try {
      coverUrl = await book.coverUrl();
      if (coverUrl) {
        coverUrl = await blobToBase64(coverUrl);
      }
    } catch (coverError) {
      console.warn('Error extracting cover:', coverError);
    }

    // Ensure we have at least a title, even if it's a fallback
    const title = metadata?.title || 'Untitled Book';
    const author = metadata?.creator || 'Unknown Author';

    return {
      title,
      author,
      coverUrl
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      title: 'Untitled Book',
      author: 'Unknown Author'
    };
  } finally {
    if (book) {
      try {
        book.destroy();
      } catch (destroyError) {
        console.warn('Error destroying book instance:', destroyError);
      }
    }
  }
};

// Book operations
export const saveBook = async (book: Book): Promise<void> => {
  try {
    // Store the book metadata
    await bookStore.setItem(book.id, book);
    
    // If there's a cover URL and it's a blob URL, convert and store it
    if (book.coverUrl && book.coverUrl.startsWith('blob:')) {
      const base64Cover = await blobToBase64(book.coverUrl);
      await coverStore.setItem(book.id, base64Cover);
      
      // Update the book object with the base64 cover
      const updatedBook = { ...book, coverUrl: base64Cover };
      await bookStore.setItem(book.id, updatedBook);
    }
  } catch (error) {
    console.error('Error saving book:', error);
    throw error;
  }
};

export const getAllBooks = async (): Promise<Book[]> => {
  try {
    const books: Book[] = [];
    const readingProgressData = safeStorageGet(READING_PROGRESS_KEY, {});
    
    // Get all books first
    await bookStore.iterate((value: any) => {
      // Only add valid books (must have at least id and title)
      if (value && typeof value === 'object' && value.id && value.title) {
      books.push(value as Book);
      } else {
        console.warn('Found invalid book entry:', value);
        // Optionally clean up invalid entries
        if (value && value.id) {
          bookStore.removeItem(value.id).catch(err => {
            console.error('Error removing invalid book:', err);
          });
        }
      }
    });

    // Sort books by last read time (from reading progress) and then by added date
    return books.sort((a, b) => {
      const progressA = readingProgressData[a.id];
      const progressB = readingProgressData[b.id];
      
      // If both books have reading progress, compare their last read times
      if (progressA?.lastRead && progressB?.lastRead) {
        return progressB.lastRead - progressA.lastRead;
      }
      
      // If only one book has reading progress, it should come first
      if (progressA?.lastRead) return -1;
      if (progressB?.lastRead) return 1;
      
      // If neither has reading progress, sort by added date
      return b.addedAt - a.addedAt;
    });
  } catch (error) {
    console.error('Error getting books:', error);
    return [];
  }
};

export const getBookById = async (id: string): Promise<Book | null> => {
  try {
    const book = await bookStore.getItem(id);
    return book as Book || null;
  } catch (error) {
    console.error('Error getting book:', error);
    return null;
  }
};

// File operations
export const saveBookFile = async (id: string, file: ArrayBuffer): Promise<void> => {
  try {
    await fileStore.setItem(id, file);
  } catch (error) {
    console.error('Error saving book file:', error);
    throw error;
  }
};

export const getBookFile = async (id: string): Promise<ArrayBuffer | null> => {
  try {
    const file = await fileStore.getItem(id);
    return file as ArrayBuffer || null;
  } catch (error) {
    console.error('Error getting book file:', error);
    return null;
  }
};

// Delete book and all associated data
export const deleteBook = async (id: string): Promise<void> => {
  try {
    await Promise.all([
      bookStore.removeItem(id),
      fileStore.removeItem(id),
      coverStore.removeItem(id),
      removeAllBookmarksForBook(id),
      removeAllHighlightsForBook(id),
      removeReadingProgress(id),
      removeBookConfig(id),
      removeTranslationState(id)
    ]);
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};

// Translation state management
interface TranslationState {
  isTranslated: boolean;
  targetLanguage: string;
  lastUpdated: number;
  translatedSections: {
    [cfi: string]: {
      content: string;
      timestamp: number;
    };
  };
}

export const getTranslationState = async (bookId: string): Promise<TranslationState | null> => {
  try {
    const state = await translationStore.getItem(`${bookId}_translation`) as TranslationState | null;
    return state;
  } catch (error) {
    console.error('Error getting translation state:', error);
    return null;
  }
};

export const saveTranslationState = async (
  bookId: string,
  state: Partial<TranslationState>
): Promise<void> => {
  try {
    const currentState = await getTranslationState(bookId) || {
      isTranslated: false,
      targetLanguage: '',
      lastUpdated: Date.now(),
      translatedSections: {}
    };

    const updatedState = {
      ...currentState,
      ...state,
      lastUpdated: Date.now()
    };

    await translationStore.setItem(`${bookId}_translation`, updatedState);
  } catch (error) {
    console.error('Error saving translation state:', error);
  }
};

export const saveTranslatedSection = async (
  bookId: string,
  cfi: string,
  content: string
): Promise<void> => {
  try {
    const state = await getTranslationState(bookId);
    if (!state) return;

    const updatedState = {
      ...state,
      translatedSections: {
        ...state.translatedSections,
        [cfi]: {
          content,
          timestamp: Date.now()
        }
      },
      lastUpdated: Date.now()
    };

    await translationStore.setItem(`${bookId}_translation`, updatedState);
  } catch (error) {
    console.error('Error saving translated section:', error);
  }
};

export const getTranslatedSection = async (
  bookId: string,
  cfi: string
): Promise<string | null> => {
  try {
    const state = await getTranslationState(bookId);
    return state?.translatedSections[cfi]?.content || null;
  } catch (error) {
    console.error('Error getting translated section:', error);
    return null;
  }
};

export const removeTranslationState = async (bookId: string): Promise<void> => {
  try {
    await translationStore.removeItem(`${bookId}_translation`);
  } catch (error) {
    console.error('Error removing translation state:', error);
  }
};

// Book configuration management
export const getBookConfig = async (bookId: string, language: string = 'original'): Promise<{ original: BookConfig; translated: BookConfig | null }> => {
  try {
    const configKey = `${bookId}_config`;
    const storedConfig = await configStore.getItem(configKey) as { [key: string]: BookConfig } | null;

    // Default configuration for original language
    const defaultConfig: BookConfig = {
      settings: DEFAULT_READER_SETTINGS,
      progress: null,
      bookmarks: [],
      highlights: [],
      language: 'original',
      lastAccessed: Date.now()
    };

    // Get or create original configuration
    const originalConfig = storedConfig?.original || defaultConfig;

    // Get translated configuration if it exists
    const translatedConfig = language !== 'original' ? storedConfig?.[language] || {
      ...defaultConfig,
      language,
      lastAccessed: Date.now()
    } : null;

    return {
      original: originalConfig,
      translated: translatedConfig
    };
  } catch (error) {
    console.error('Error getting book config:', error);
    throw new Error('Failed to retrieve book configuration');
  }
};

export const saveBookConfig = async (
  bookId: string,
  language: string,
  config: Partial<BookConfig>
): Promise<void> => {
  try {
    const configKey = `${bookId}_config`;
    const storedConfig = await configStore.getItem(configKey) as { [key: string]: BookConfig } | null || {};
    
    const existingConfig = storedConfig[language] || {
      settings: DEFAULT_READER_SETTINGS,
      progress: null,
      bookmarks: [],
      highlights: [],
      language,
      lastAccessed: Date.now()
    };

    // Update configuration with new values
    const updatedConfig = {
      ...existingConfig,
      ...config,
      lastAccessed: Date.now()
    };

    // Save updated configuration
    await configStore.setItem(configKey, {
      ...storedConfig,
      [language]: updatedConfig
    });
  } catch (error) {
    console.error('Error saving book config:', error);
    throw new Error('Failed to save book configuration');
  }
};

export const removeBookConfig = async (bookId: string): Promise<void> => {
  try {
    const configKey = `${bookId}_config`;
    await configStore.removeItem(configKey);
  } catch (error) {
    console.error('Error removing book config:', error);
    throw new Error('Failed to remove book configuration');
  }
};

// Bookmarks
export const getBookmarks = async (bookId: string): Promise<Bookmark[]> => {
  try {
    // Try to get from localforage first
    const cachedBookmarks = await bookmarkStore.getItem(`${bookId}_bookmarks`);
    if (cachedBookmarks) {
      return cachedBookmarks as Bookmark[];
    }

    // Fallback to localStorage if not in cache
    const allBookmarks = safeStorageGet(BOOKMARKS_KEY, {});
    const bookmarks = allBookmarks[bookId] || [];

    // Cache the bookmarks
    try {
      await bookmarkStore.setItem(`${bookId}_bookmarks`, bookmarks);
    } catch (cacheError) {
      console.error('Error caching bookmarks:', cacheError);
    }
    
    return bookmarks;
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    // Final fallback to localStorage
    const allBookmarks = safeStorageGet(BOOKMARKS_KEY, {});
    return allBookmarks[bookId] || [];
  }
};

export const saveBookmark = async (bookId: string, bookmark: Bookmark): Promise<void> => {
  try {
    // Get current bookmarks from cache
    const bookmarks = await getBookmarks(bookId);
    const existingIndex = bookmarks.findIndex(b => b.cfi === bookmark.cfi);
    
    if (existingIndex >= 0) {
      bookmarks[existingIndex] = bookmark;
    } else {
      bookmarks.push(bookmark);
    }
    
    // Save to cache
    await bookmarkStore.setItem(`${bookId}_bookmarks`, bookmarks);
    
    // Also save to localStorage for backup
    const allBookmarks = safeStorageGet(BOOKMARKS_KEY, {});
    allBookmarks[bookId] = bookmarks;
    safeStorageSet(BOOKMARKS_KEY, allBookmarks);
  } catch (error) {
    console.error('Error saving bookmark:', error);
  }
};

export const removeBookmark = async (bookId: string, cfi: string): Promise<void> => {
  try {
    // Get current bookmarks from cache
    const bookmarks = await getBookmarks(bookId);
    const updatedBookmarks = bookmarks.filter(b => b.cfi !== cfi);
    
    // Save to cache
    await bookmarkStore.setItem(`${bookId}_bookmarks`, updatedBookmarks);
    
    // Also update localStorage
    const allBookmarks = safeStorageGet(BOOKMARKS_KEY, {});
    allBookmarks[bookId] = updatedBookmarks;
    safeStorageSet(BOOKMARKS_KEY, allBookmarks);
  } catch (error) {
    console.error('Error removing bookmark:', error);
  }
};

export const removeAllBookmarksForBook = async (bookId: string): Promise<void> => {
  try {
    // Remove from cache
    await bookmarkStore.removeItem(`${bookId}_bookmarks`);
    
    // Remove from localStorage
    const allBookmarks = safeStorageGet(BOOKMARKS_KEY, {});
    delete allBookmarks[bookId];
    safeStorageSet(BOOKMARKS_KEY, allBookmarks);
  } catch (error) {
    console.error('Error removing all bookmarks:', error);
  }
};

// Highlights
export const getHighlights = async (bookId: string, isTranslated: boolean = false): Promise<Highlight[]> => {
  try {
    // Use different key for translated version
    const key = isTranslated ? `${bookId}_translated` : bookId;
    
    // Try to get from localforage first
    const cachedHighlights = await highlightStore.getItem(`${key}_highlights`);
    if (cachedHighlights) {
      return cachedHighlights as Highlight[];
    }

    // Fallback to localStorage if not in cache
    const allHighlights = safeStorageGet(HIGHLIGHTS_KEY, {});
    const highlights = allHighlights[key] || [];
    
    // Ensure all highlights have a percentage field
    const validatedHighlights = highlights.map((h: Highlight) => ({
      ...h,
      percentage: h.percentage || 0
    }));

    // Cache the highlights
    await highlightStore.setItem(`${key}_highlights`, validatedHighlights);
    
    return validatedHighlights;
  } catch (error) {
    console.error('Error getting highlights:', error);
    return [];
  }
};

export const saveHighlight = async (bookId: string, highlight: Highlight, isTranslated: boolean = false): Promise<void> => {
  try {
    // Use different key for translated version
    const key = isTranslated ? `${bookId}_translated` : bookId;
    
    // Get current highlights from cache
    const highlights = await getHighlights(bookId, isTranslated);
    const existingIndex = highlights.findIndex(h => h.cfi === highlight.cfi);
    
    if (existingIndex >= 0) {
      highlights[existingIndex] = highlight;
    } else {
      highlights.push(highlight);
    }
    
    // Save to cache
    await highlightStore.setItem(`${key}_highlights`, highlights);
    
    // Also save to localStorage for backup
    const allHighlights = safeStorageGet(HIGHLIGHTS_KEY, {});
    allHighlights[key] = highlights;
    safeStorageSet(HIGHLIGHTS_KEY, allHighlights);
  } catch (error) {
    console.error('Error saving highlight:', error);
  }
};

export const removeHighlight = async (bookId: string, cfi: string, isTranslated: boolean = false): Promise<void> => {
  try {
    // Use different key for translated version
    const key = isTranslated ? `${bookId}_translated` : bookId;
    
    // Get current highlights from cache
    const highlights = await getHighlights(bookId, isTranslated);
    const updatedHighlights = highlights.filter(h => h.cfi !== cfi);
    
    // Save to cache
    await highlightStore.setItem(`${key}_highlights`, updatedHighlights);
    
    // Also update localStorage
    const allHighlights = safeStorageGet(HIGHLIGHTS_KEY, {});
    allHighlights[key] = updatedHighlights;
    safeStorageSet(HIGHLIGHTS_KEY, allHighlights);
  } catch (error) {
    console.error('Error removing highlight:', error);
  }
};

export const removeAllHighlightsForBook = async (bookId: string): Promise<void> => {
  try {
    // Remove both original and translated highlights from cache
    await highlightStore.removeItem(`${bookId}_highlights`);
    await highlightStore.removeItem(`${bookId}_translated_highlights`);
    
    // Remove from localStorage
    const allHighlights = safeStorageGet(HIGHLIGHTS_KEY, {});
    delete allHighlights[bookId];
    delete allHighlights[`${bookId}_translated`];
    safeStorageSet(HIGHLIGHTS_KEY, allHighlights);
  } catch (error) {
    console.error('Error removing all highlights:', error);
  }
};

// Reader Settings
export const getReaderSettings = (): ReaderSettings => {
  try {
    const settings = safeStorageGet(READER_SETTINGS_KEY, DEFAULT_READER_SETTINGS);
    return { ...DEFAULT_READER_SETTINGS, ...settings };
  } catch (error) {
    console.error('Error getting reader settings:', error);
    return DEFAULT_READER_SETTINGS;
  }
};

export const saveReaderSettings = (settings: ReaderSettings): void => {
  try {
    safeStorageSet(READER_SETTINGS_KEY, settings);
  } catch (error) {
    console.error('Error saving reader settings:', error);
  }
};

// Reading Progress
export const saveReadingProgress = (bookId: string, progress: ReadingProgress): void => {
  try {
    if (!progress.cfi || typeof progress.percentage !== 'number') {
      console.error('Invalid progress data:', progress);
      return;
    }

    const allProgress = safeStorageGet(READING_PROGRESS_KEY, {});
    
    const validatedProgress = {
      ...progress,
      lastRead: Date.now(),
      percentage: Math.max(0, Math.min(100, parseFloat(progress.percentage.toFixed(2)))),
      cfi: progress.cfi,
      href: progress.href,
      location: progress.location || 0
    };

    const key = progress.isTranslated ? `${bookId}_translated` : bookId;
    
    console.log(`Saving progress for ${key}:`, validatedProgress);
    
    allProgress[key] = validatedProgress;
    safeStorageSet(READING_PROGRESS_KEY, allProgress);
    
    // Backup to multiple storage mechanisms
    try {
      // Try sessionStorage
      sessionStorage.setItem(
        `${READING_PROGRESS_KEY}_${key}`,
        safeJSONStringify(validatedProgress)
      );
      
      // Try localforage as additional backup
      bookStore.setItem(`progress_${key}`, validatedProgress).catch(err => {
        console.error('Error saving progress to localforage:', err);
      });
    } catch (err) {
      console.error('Error saving progress backup:', err);
    }
  } catch (error) {
    console.error('Error saving reading progress:', error);
  }
};

export const getReadingProgress = (bookId: string, isTranslated: boolean = false): ReadingProgress | null => {
  try {
    const key = isTranslated ? `${bookId}_translated` : bookId;
    const allProgress = safeStorageGet(READING_PROGRESS_KEY, {});
    let progress = allProgress[key];

    // If no progress in localStorage, try other storage mechanisms
    if (!progress?.cfi) {
      // Try sessionStorage
      try {
        const sessionProgress = safeJSONParse(
          sessionStorage.getItem(`${READING_PROGRESS_KEY}_${key}`)
        );
        if (sessionProgress?.cfi) {
          progress = sessionProgress;
        }
      } catch (sessionError) {
        console.error('Error reading from sessionStorage:', sessionError);
      }

      // If still no progress, try localforage
      if (!progress?.cfi) {
        bookStore.getItem(`progress_${key}`).then(forageProgress => {
          if (forageProgress) {
            progress = forageProgress;
            // Sync back to localStorage
            const updatedProgress = { ...allProgress, [key]: progress };
            safeStorageSet(READING_PROGRESS_KEY, updatedProgress);
          }
        }).catch(err => {
          console.error('Error reading from localforage:', err);
        });
      }
    }

    if (progress?.cfi && typeof progress.percentage === 'number') {
      const validatedProgress = {
        cfi: progress.cfi,
        href: progress.href || '',
        percentage: parseFloat(progress.percentage.toFixed(2)),
        lastRead: progress.lastRead || Date.now(),
        isTranslated: !!progress.isTranslated,
        location: progress.location || 0
      };
      return validatedProgress;
    }

    return null;
  } catch (error) {
    console.error('Error getting reading progress:', error);
    return null;
  }
};

export const removeReadingProgress = (bookId: string): void => {
  try {
    const allProgress = safeStorageGet(READING_PROGRESS_KEY, {});
    
    // Remove both translated and non-translated progress
    delete allProgress[bookId];
    delete allProgress[`${bookId}_translated`];
    
    safeStorageSet(READING_PROGRESS_KEY, allProgress);

    // Remove from backup storage
    try {
      sessionStorage.removeItem(`${READING_PROGRESS_KEY}_${bookId}`);
      sessionStorage.removeItem(`${READING_PROGRESS_KEY}_${bookId}_translated`);
    } catch (err) {
      console.error('Error removing progress backup:', err);
    }
  } catch (error) {
    console.error('Error removing reading progress:', error);
  }
};

export const generateBookId = (file: File): string => {
  return `${file.name}-${file.size}-${file.lastModified}`;
};

interface GetBookOptions {
  language?: string;
  withConfig?: boolean;
}

export const getBook = async (bookId: string, options: GetBookOptions = {}) => {
  try {
    // Get book metadata
    const book = await bookStore.getItem(bookId) as Book | null;
    if (!book) return null;

    // Get book configuration for the specified language
    const { original, translated } = await getBookConfig(bookId, options.language);
    const config = options.language === 'original' ? original : translated || original;

    // Get translation state if a language is specified
    let translationState = null;
    if (options.language && options.language !== 'original') {
      translationState = await getTranslationState(bookId);
    }

    return {
      ...book,
      config,
      translationState,
    };
  } catch (error) {
    console.error('Error getting book:', error);
    return null;
  }
};