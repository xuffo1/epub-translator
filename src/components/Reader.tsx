import React, { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';
import { BookLocation, BookMetadata, ReaderSettings as ReaderSettingsType, Bookmark, DEFAULT_READER_SETTINGS } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  ArrowLeft, 
  Bookmark as BookmarkIcon,
  Settings,
  Search,
  X,
  Languages
} from 'lucide-react';
import TranslationPanel from './TranslationPanel';
import ReaderSettingsComponent from './ReaderSettings';
import BookmarksList from './BookmarksList';
import { 
  getBookmarks, 
  saveBookmark, 
  removeBookmark, 
  getReaderSettings, 
  saveReaderSettings,
  saveReadingProgress,
  getReadingProgress,
  generateBookId
} from '../services/storageService';

// Import JSZip explicitly to ensure it's available
import 'jszip';

interface ReaderProps {
  file: File;
  onClose: () => void;
}

type SidebarContent = 'toc' | 'bookmarks' | 'settings' | 'search';

interface MenuPosition {
  x: number;
  y: number;
}

const Reader: React.FC<ReaderProps> = ({ file, onClose }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [book, setBook] = useState<any>(null);
  const [rendition, setRendition] = useState<any>(null);
  const [metadata, setMetadata] = useState<BookMetadata | null>(null);
  const [location, setLocation] = useState<BookLocation | null>(null);
  const [toc, setToc] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<SidebarContent>('toc');
  const [selectedText, setSelectedText] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [readerSettings, setReaderSettings] = useState<ReaderSettingsType>(DEFAULT_READER_SETTINGS);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [bookId, setBookId] = useState('');
  const [currentChapter, setCurrentChapter] = useState<string>('');
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 });

  // Generate a unique ID for the book
  useEffect(() => {
    if (file) {
      const id = generateBookId(file);
      setBookId(id);
    }
  }, [file]);

  // Load bookmarks
  useEffect(() => {
    if (bookId) {
      const loadedBookmarks = getBookmarks(bookId);
      setBookmarks(loadedBookmarks);
    }
  }, [bookId]);

  // Load reader settings
  useEffect(() => {
    const settings = getReaderSettings();
    setReaderSettings(settings);
  }, []);

  // Apply reader settings to rendition
  useEffect(() => {
    if (rendition) {
      try {
        // Create a stylesheet for better control
        const stylesheet = rendition.themes.default({
          body: {
            'font-size': `${readerSettings.fontSize}%`,
            'font-family': readerSettings.fontFamily,
            'line-height': `${readerSettings.lineHeight}`,
            'color': readerSettings.theme === 'light' ? '#000000' : 
                    readerSettings.theme === 'sepia' ? '#5f4b32' : '#cccccc',
            'background': readerSettings.theme === 'light' ? '#ffffff' : 
                         readerSettings.theme === 'sepia' ? '#f8f1e3' : '#222222',
            'padding-left': `${readerSettings.margin}%`,
            'padding-right': `${readerSettings.margin}%`,
            'text-align': 'justify'
          },
          'p': {
            'text-align': 'justify',
            'text-indent': '1em',
            'margin-top': '0.5em',
            'margin-bottom': '0.5em'
          },
          'h1, h2, h3, h4, h5, h6': {
            'text-align': 'center',
            'margin-top': '1em',
            'margin-bottom': '0.5em'
          }
        });
        
        // Force rendition to reload with new settings
        const currentLocation = rendition.currentLocation();
        if (currentLocation && currentLocation.start) {
          const cfi = currentLocation.start.cfi;
          rendition.display(cfi);
        }
        
        // Save settings to localStorage
        saveReaderSettings(readerSettings);
      } catch (err) {
        console.error("Error applying reader settings:", err);
      }
    }
  }, [rendition, readerSettings]);

  useEffect(() => {
    let bookInstance: any = null;
    let fileUrl: string | null = null;

    const loadBook = async () => {
      if (!file || !viewerRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        // Create a blob URL from the file
        fileUrl = URL.createObjectURL(file);
        console.log("Created file URL:", fileUrl);
        
        // Initialize the book with explicit options
        bookInstance = ePub(fileUrl, {
          openAs: 'epub',
          restore: false
        });
        setBook(bookInstance);
        console.log("Book instance created");

        // Wait for book to be ready
        await bookInstance.ready;
        console.log("Book is ready");

        // Load book metadata
        try {
          const metadata = await bookInstance.loaded.metadata;
          console.log("Metadata loaded:", metadata);
          setMetadata({
            title: metadata.title || file.name.replace('.epub', ''),
            creator: metadata.creator,
            publisher: metadata.publisher,
            language: metadata.language,
          });
        } catch (err) {
          console.error("Error loading metadata:", err);
          // Use filename as fallback for title
          setMetadata({
            title: file.name.replace('.epub', ''),
            creator: 'Unknown',
            publisher: 'Unknown',
            language: 'Unknown',
          });
        }

        // Load table of contents
        try {
          const navigation = await bookInstance.loaded.navigation;
          console.log("Navigation loaded:", navigation);
          setToc(navigation.toc || []);
        } catch (err) {
          console.error("Error loading navigation:", err);
          setToc([]);
        }

        // Create rendition with explicit dimensions
        const viewerWidth = viewerRef.current.clientWidth;
        const viewerHeight = viewerRef.current.clientHeight;
        console.log("Viewer dimensions:", viewerWidth, viewerHeight);

        const newRendition = bookInstance.renderTo(viewerRef.current, {
          width: viewerWidth || 600,
          height: viewerHeight || 800,
          spread: 'none',
          flow: 'paginated',
          minSpreadWidth: 900,
          allowScriptedContent: false
        });
        setRendition(newRendition);
        console.log("Rendition created");

        // Check for saved reading progress
        const progress = getReadingProgress(generateBookId(file));
        
        // Display the book
        try {
          if (progress && progress.cfi) {
            await newRendition.display(progress.cfi);
            console.log("Book displayed at saved position:", progress.cfi);
          } else {
            await newRendition.display();
            console.log("Book displayed at beginning");
          }
          
          // Generate locations for better navigation (after display)
          try {
            await bookInstance.locations.generate(1024);
            console.log("Locations generated");
          } catch (locErr) {
            console.error("Error generating locations:", locErr);
            // Non-critical error, continue
          }
          
          setIsLoading(false);
        } catch (displayErr) {
          console.error("Error displaying book:", displayErr);
          setError("Failed to display the book. The EPUB file may be corrupted or in an unsupported format.");
          setIsLoading(false);
        }

        // Track location changes
        newRendition.on('locationChanged', (locationChanged: any) => {
          try {
            const currentLocation = newRendition.currentLocation();
            if (!currentLocation || !currentLocation.start) return;
            
            const cfi = currentLocation.start.cfi;
            const href = currentLocation.start.href;
            let percentage = 0;
            
            try {
              if (bookInstance.locations && bookInstance.locations.percentageFromCfi) {
                percentage = bookInstance.locations.percentageFromCfi(cfi);
              }
            } catch (err) {
              console.error("Error calculating percentage:", err);
            }
            
            const locationObj = {
              cfi,
              href,
              percentage: Math.floor(percentage * 100) || 0,
              location: currentLocation.start.location || 0,
            };
            
            setLocation(locationObj);
            
            // Save reading progress
            saveReadingProgress(generateBookId(file), {
              cfi,
              percentage: Math.floor(percentage * 100) || 0,
              lastRead: Date.now()
            });
            
            // Update current chapter
            updateCurrentChapter(href);
          } catch (err) {
            console.error("Error in locationChanged handler:", err);
          }
        });

        // Handle text selection
        newRendition.on('selected', (cfiRange: string, contents: any) => {
          try {
            if (!contents || !contents.window) return;
            const selection = contents.window.getSelection();
            if (!selection) return;
            
            const text = selection.toString().trim();
            if (text && text.length > 0) {
              setSelectedText(text);
              setShowTranslation(true);
            }
          } catch (err) {
            console.error("Error in selected handler:", err);
          }
        });

        // Text selection translation
        newRendition.hooks.content.register((contents: any) => {
          const document = contents.window.document;
          const window = contents.window;

          document.addEventListener('mouseup', (event: MouseEvent) => {
            const selection = window.getSelection();
            const text = selection?.toString().trim();
            
            if (text) {
              const range = selection?.getRangeAt(0);
              const rect = range?.getBoundingClientRect();
              
              if (rect) {
                const iframe = document.defaultView?.frameElement as HTMLIFrameElement;
                if (iframe) {
                  const iframeRect = iframe.getBoundingClientRect();
                  setSelectedText(text);
                  
                  // Position the menu at the center of the page instead of at the selection
                  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                  setMenuPosition({
                    x: iframeRect.left + (viewportWidth / 2),
                    y: rect.bottom + iframeRect.top
                  });
                  setShowTranslateMenu(true);
                  event.preventDefault();
                }
              }
            } else {
              setShowTranslateMenu(false);
            }
          });
        });

      } catch (err) {
        console.error("Error initializing book:", err);
        setError("Failed to initialize the book. Please try another EPUB file.");
        setIsLoading(false);
      }
    };

    loadBook();

    // Clean up
    return () => {
      console.log("Cleaning up resources");
      if (bookInstance) {
        try {
          bookInstance.destroy();
        } catch (err) {
          console.error("Error destroying book:", err);
        }
      }
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [file]);

  const updateCurrentChapter = (href: string) => {
    const chapter = toc.find(item => item.href === href);
    if (chapter) {
      setCurrentChapter(chapter.label);
    } else {
      // Try to find the closest chapter
      const matchingChapter = toc.find(item => href.includes(item.href));
      if (matchingChapter) {
        setCurrentChapter(matchingChapter.label);
      }
    }
  };

  const goToPrevious = () => {
    if (rendition) {
      try {
        rendition.prev();
      } catch (err) {
        console.error("Error navigating to previous page:", err);
      }
    }
  };

  const goToNext = () => {
    if (rendition) {
      try {
        rendition.next();
      } catch (err) {
        console.error("Error navigating to next page:", err);
      }
    }
  };

  const goToChapter = (href: string) => {
    if (rendition) {
      try {
        rendition.display(href);
        setShowSidebar(false);
      } catch (err) {
        console.error("Error navigating to chapter:", err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  const toggleSidebar = (content: SidebarContent) => {
    if (showSidebar && sidebarContent === content) {
      setShowSidebar(false);
    } else {
      setShowSidebar(true);
      setSidebarContent(content);
    }
  };

  const addBookmark = () => {
    if (!location || !bookId) return;
    
    const newBookmark: Bookmark = {
      cfi: location.cfi,
      href: location.href,
      text: `Page ${location.percentage}%`,
      chapter: currentChapter,
      createdAt: Date.now()
    };
    
    saveBookmark(bookId, newBookmark);
    
    // Update local state
    setBookmarks([...bookmarks, newBookmark]);
  };

  const handleBookmarkClick = (bookmark: Bookmark) => {
    if (rendition) {
      try {
        rendition.display(bookmark.cfi);
        setShowSidebar(false);
      } catch (err) {
        console.error("Error navigating to bookmark:", err);
      }
    }
  };

  const handleBookmarkDelete = (cfi: string) => {
    if (!bookId) return;
    
    removeBookmark(bookId, cfi);
    
    // Update local state
    setBookmarks(bookmarks.filter(b => b.cfi !== cfi));
  };

  const handleSettingsChange = (newSettings: ReaderSettingsType) => {
    setReaderSettings(newSettings);
  };

  const handleSearch = async () => {
    if (!book || !searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const results = await book.search(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error("Error searching:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const goToSearchResult = (cfi: string) => {
    if (rendition) {
      try {
        rendition.display(cfi);
        setShowSidebar(false);
      } catch (err) {
        console.error("Error navigating to search result:", err);
      }
    }
  };

  // Get background color based on theme
  const getBackgroundColor = () => {
    switch (readerSettings.theme) {
      case 'sepia': return 'bg-[#f8f1e3]';
      case 'dark': return 'bg-gray-900';
      default: return 'bg-white';
    }
  };

  // Get text color based on theme
  const getTextColor = () => {
    switch (readerSettings.theme) {
      case 'sepia': return 'text-[#5f4b32]';
      case 'dark': return 'text-gray-200';
      default: return 'text-gray-800';
    }
  };

  // Handle Translation Function
  const handleTranslate = (targetLang: string) => {
    const encodedText = encodeURIComponent(selectedText);
    window.open(
      `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodedText}&op=translate`,
      '_blank'
    );
    setShowTranslateMenu(false);
  };

  // Toggle Google Translate Function
  const toggleGoogleTranslate = () => {
    const frame = document.querySelector('.goog-te-menu-frame') as HTMLIFrameElement;
    if (frame) {
      frame.style.display = frame.style.display === 'none' ? 'block' : 'none';
    }
  };

  return (
    <div 
      className={`flex flex-col h-screen ${readerSettings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}
      tabIndex={0} 
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <header className={`flex items-center justify-between p-4 ${readerSettings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white shadow-sm'}`}>
        <div className="flex items-center">
          <button 
            onClick={onClose}
            className={`p-2 rounded-md ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} mr-2`}
            aria-label="Back to library"
          >
            <ArrowLeft size={20} />
          </button>
          <button 
            onClick={() => toggleSidebar('toc')}
            className={`p-2 rounded-md ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${showSidebar && sidebarContent === 'toc' ? 'bg-blue-100 text-blue-600' : ''}`}
            aria-label="Table of contents"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <h1 className="text-lg font-medium truncate max-w-[40%]">
          {metadata?.title || 'Loading...'}
        </h1>
        
        <div className="flex items-center space-x-1">
          <button 
            onClick={toggleGoogleTranslate}
            className={`flex items-center space-x-1 p-2 rounded-md ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            aria-label="Translate"
          >
            <Languages size={18} />
          </button>
          <button 
            onClick={() => toggleSidebar('search')}
            className={`p-2 rounded-md ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${showSidebar && sidebarContent === 'search' ? 'bg-blue-100 text-blue-600' : ''}`}
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          <button 
            onClick={addBookmark}
            className={`p-2 rounded-md ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            aria-label="Add bookmark"
          >
            <BookmarkIcon size={18} />
          </button>
          <button 
            onClick={() => toggleSidebar('bookmarks')}
            className={`p-2 rounded-md ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${showSidebar && sidebarContent === 'bookmarks' ? 'bg-blue-100 text-blue-600' : ''}`}
            aria-label="Bookmarks"
          >
            <BookmarkIcon size={18} className="fill-current" />
          </button>
          <button 
            onClick={() => toggleSidebar('settings')}
            className={`p-2 rounded-md ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${showSidebar && sidebarContent === 'settings' ? 'bg-blue-100 text-blue-600' : ''}`}
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className={`w-72 flex-shrink-0 overflow-y-auto border-r ${readerSettings.theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="p-4">
              {sidebarContent === 'toc' && (
                <div>
                  <h2 className="text-lg font-medium mb-4">Table of Contents</h2>
                  {toc.length > 0 ? (
                    <ul className="space-y-2">
                      {toc.map((item, index) => (
                        <li key={index}>
                          <button
                            onClick={() => goToChapter(item.href)}
                            className={`text-left w-full p-2 rounded-md hover:bg-gray-100 ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No table of contents available</p>
                  )}
                </div>
              )}
              
              {sidebarContent === 'bookmarks' && (
                <div>
                  <h2 className="text-lg font-medium mb-4">Bookmarks</h2>
                  <BookmarksList 
                    bookmarks={bookmarks} 
                    onBookmarkClick={handleBookmarkClick} 
                    onBookmarkDelete={handleBookmarkDelete} 
                  />
                </div>
              )}
              
              {sidebarContent === 'settings' && (
                <div>
                  <h2 className="text-lg font-medium mb-4">Settings</h2>
                  <ReaderSettingsComponent 
                    settings={readerSettings} 
                    onSettingsChange={handleSettingsChange} 
                    onClose={() => setShowSidebar(false)} 
                  />
                </div>
              )}
              
              {sidebarContent === 'search' && (
                <div>
                  <h2 className="text-lg font-medium mb-4">Search</h2>
                  <div className="mb-4">
                    <div className="flex">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search in book..."
                        className={`flex-1 p-2 border rounded-l-md ${readerSettings.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch();
                          }
                        }}
                      />
                      <button
                        onClick={handleSearch}
                        className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                      >
                        <Search size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {isSearching ? (
                    <div className="flex justify-center py-4">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div>
                      <p className="mb-2 text-sm">{searchResults.length} results found</p>
                      <ul className="space-y-2">
                        {searchResults.map((result, index) => (
                          <li key={index}>
                            <button
                              onClick={() => goToSearchResult(result.cfi)}
                              className={`text-left w-full p-2 rounded-md text-sm ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                              <span className="line-clamp-3">{result.excerpt}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : searchQuery ? (
                    <p className="text-gray-500">No results found</p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Reader */}
        <div className="flex-1 flex flex-col relative">
          {/* Book content */}
          <div 
            ref={viewerRef} 
            className={`flex-1 ${getBackgroundColor()} ${getTextColor()}`}
          ></div>
          
          {/* Navigation buttons */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            <button
              onClick={goToPrevious}
              className={`p-2 rounded-r-md bg-opacity-50 ${readerSettings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}`}
              aria-label="Previous page"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
          
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              onClick={goToNext}
              className={`p-2 rounded-l-md bg-opacity-50 ${readerSettings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}`}
              aria-label="Next page"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading book...</p>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center max-w-md p-6 bg-red-50 rounded-lg">
                <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Book</h3>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Back to Library
                </button>
              </div>
            </div>
          )}
          
          {/* Footer with progress */}
          <div className={`p-2 flex justify-between items-center text-xs ${readerSettings.theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-500 border-t border-gray-200'}`}>
            <div>
              {currentChapter && (
                <span className="truncate max-w-[200px] inline-block">{currentChapter}</span>
              )}
            </div>
            <div>
              {location && (
                <span>{location.percentage}%</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Translation panel */}
      {showTranslation && selectedText && (
        <TranslationPanel 
          text={selectedText} 
          onClose={() => setShowTranslation(false)} 
        />
      )}

      {/* Translation menu for selected text - Centered */}
      {showTranslateMenu && (
        <div 
          className="fixed left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-2 z-50"
          style={{
            top: `${menuPosition.y + 10}px`,
            maxWidth: '300px',
            width: '100%'
          }}
        >
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleTranslate('es')}
              className="px-4 py-2 text-sm hover:bg-gray-100 rounded transition-colors text-left whitespace-nowrap"
            >
              Traducir al Español
            </button>
            <button
              onClick={() => handleTranslate('en')}
              className="px-4 py-2 text-sm hover:bg-gray-100 rounded transition-colors text-left whitespace-nowrap"
            >
              Translate to English
            </button>
            <button
              onClick={() => handleTranslate('fr')}
              className="px-4 py-2 text-sm hover:bg-gray-100 rounded transition-colors text-left whitespace-nowrap"
            >
              Traduire en Français
            </button>
            <button
              onClick={() => handleTranslate('de')}
              className="px-4 py-2 text-sm hover:bg-gray-100 rounded transition-colors text-left whitespace-nowrap"
            >
              Auf Deutsch übersetzen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reader;