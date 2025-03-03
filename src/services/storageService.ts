import { Bookmark, ReaderSettings, DEFAULT_READER_SETTINGS } from '../types';

// Storage keys
const BOOKMARKS_KEY = 'epub_reader_bookmarks';
const READER_SETTINGS_KEY = 'epub_reader_settings';
const READING_PROGRESS_KEY = 'epub_reader_progress';

// Bookmarks
export const getBookmarks = (bookId: string): Bookmark[] => {
  try {
    const allBookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '{}');
    return allBookmarks[bookId] || [];
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    return [];
  }
};

export const saveBookmark = (bookId: string, bookmark: Bookmark): void => {
  try {
    const allBookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '{}');
    const bookBookmarks = allBookmarks[bookId] || [];
    
    // Check if bookmark with same CFI already exists
    const existingIndex = bookBookmarks.findIndex((b: Bookmark) => b.cfi === bookmark.cfi);
    
    if (existingIndex >= 0) {
      // Update existing bookmark
      bookBookmarks[existingIndex] = bookmark;
    } else {
      // Add new bookmark
      bookBookmarks.push(bookmark);
    }
    
    allBookmarks[bookId] = bookBookmarks;
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(allBookmarks));
  } catch (error) {
    console.error('Error saving bookmark:', error);
  }
};

export const removeBookmark = (bookId: string, cfi: string): void => {
  try {
    const allBookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '{}');
    const bookBookmarks = allBookmarks[bookId] || [];
    
    allBookmarks[bookId] = bookBookmarks.filter((b: Bookmark) => b.cfi !== cfi);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(allBookmarks));
  } catch (error) {
    console.error('Error removing bookmark:', error);
  }
};

// Reader Settings
export const getReaderSettings = (): ReaderSettings => {
  try {
    const settings = JSON.parse(localStorage.getItem(READER_SETTINGS_KEY) || '{}');
    return { ...DEFAULT_READER_SETTINGS, ...settings };
  } catch (error) {
    console.error('Error getting reader settings:', error);
    return DEFAULT_READER_SETTINGS;
  }
};

export const saveReaderSettings = (settings: ReaderSettings): void => {
  try {
    localStorage.setItem(READER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving reader settings:', error);
  }
};

// Reading Progress
interface ReadingProgress {
  cfi: string;
  percentage: number;
  lastRead: number;
}

export const saveReadingProgress = (bookId: string, progress: ReadingProgress): void => {
  try {
    const allProgress = JSON.parse(localStorage.getItem(READING_PROGRESS_KEY) || '{}');
    allProgress[bookId] = progress;
    localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Error saving reading progress:', error);
  }
};

export const getReadingProgress = (bookId: string): ReadingProgress | null => {
  try {
    const allProgress = JSON.parse(localStorage.getItem(READING_PROGRESS_KEY) || '{}');
    return allProgress[bookId] || null;
  } catch (error) {
    console.error('Error getting reading progress:', error);
    return null;
  }
};

export const removeReadingProgress = (bookId: string): void => {
  try {
    const allProgress = JSON.parse(localStorage.getItem(READING_PROGRESS_KEY) || '{}');
    if (allProgress[bookId]) {
      delete allProgress[bookId];
      localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(allProgress));
    }
  } catch (error) {
    console.error('Error removing reading progress:', error);
  }
};

// Recent Books
interface RecentBook {
  id: string;
  name: string;
  size: number;
  lastOpened: number;
  coverUrl?: string;
  author?: string;
}

const RECENT_BOOKS_KEY = 'recentBooks';

export const getRecentBooks = (): RecentBook[] => {
  try {
    const books = JSON.parse(localStorage.getItem(RECENT_BOOKS_KEY) || '[]');
    return books;
  } catch (error) {
    console.error('Error getting recent books:', error);
    return [];
  }
};

export const addRecentBook = (book: RecentBook): void => {
  try {
    const books = getRecentBooks();
    
    // Remove if already exists
    const filteredBooks = books.filter(b => b.id !== book.id);
    
    // Add to beginning of array
    const updatedBooks = [book, ...filteredBooks].slice(0, 10); // Keep only 10 most recent
    
    localStorage.setItem(RECENT_BOOKS_KEY, JSON.stringify(updatedBooks));
  } catch (error) {
    console.error('Error adding recent book:', error);
  }
};

export const removeRecentBook = (bookId: string): void => {
  try {
    const books = getRecentBooks();
    const filteredBooks = books.filter(book => book.id !== bookId);
    localStorage.setItem(RECENT_BOOKS_KEY, JSON.stringify(filteredBooks));
    
    // Also remove any bookmarks and reading progress for this book
    removeAllBookmarksForBook(bookId);
    removeReadingProgress(bookId);
  } catch (error) {
    console.error('Error removing recent book:', error);
  }
};

export const removeAllBookmarksForBook = (bookId: string): void => {
  try {
    const allBookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '{}');
    if (allBookmarks[bookId]) {
      delete allBookmarks[bookId];
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(allBookmarks));
    }
  } catch (error) {
    console.error('Error removing all bookmarks for book:', error);
  }
};

export const generateBookId = (file: File): string => {
  return `${file.name}-${file.size}-${file.lastModified}`;
};