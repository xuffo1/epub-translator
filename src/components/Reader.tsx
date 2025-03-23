import React, { useState, useEffect, useRef } from 'react';
import ePub from 'epubjs';
import { BookLocation, BookMetadata, ReaderSettings as ReaderSettingsType, Bookmark, Highlight, DEFAULT_READER_SETTINGS } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  ArrowLeft, 
  Bookmark as BookmarkIcon,
  Settings,
  Search,
  X,
  Highlighter,
  Copy
} from 'lucide-react';
import TranslationPanel from './TranslationPanel';
import ReaderSettingsComponent from './ReaderSettings';
import BookmarksList from './BookmarksList';
import HighlightsList from './HighlightsList';
import HighlightMenu from './HighlightMenu';
import { 
  getBookmarks, 
  saveBookmark, 
  removeBookmark, 
  getReaderSettings, 
  saveReaderSettings,
  saveReadingProgress,
  getReadingProgress,
  generateBookId,
  getHighlights,
  saveHighlight,
  removeHighlight
} from '../services/storageService';

// Import JSZip explicitly to ensure it's available
import 'jszip';

interface ReaderProps {
  file: File;
  onClose: () => void;
}

type SidebarContent = 'toc' | 'bookmarks' | 'settings' | 'search' | 'highlights';

interface MenuPosition {
  x: number;
  y: number;
}

interface ReadingProgress {
  cfi: string;
  href: string;
  percentage: number;
  lastRead: number;
  isTranslated: boolean;
  location: number;
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
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [readerSettings, setReaderSettings] = useState<ReaderSettingsType>(DEFAULT_READER_SETTINGS);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [bookId, setBookId] = useState('');
  const [currentChapter, setCurrentChapter] = useState<string>('');
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<{
    cfiRange: string;
    text: string;
    contents: any;
  } | null>(null);
  const [isCurrentPageBookmarked, setIsCurrentPageBookmarked] = useState(false);

  // Handle back navigation with improved state preservation
  const handleBack = async () => {
    try {
      if (location) {
        const translateElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        const isTranslated = translateElement?.value ? translateElement.value !== 'original' : false;
        
        // Save detailed reading progress before navigating
        await saveReadingProgress(bookId, {
          cfi: location.cfi,
          href: location.href,
          percentage: location.percentage,
          lastRead: Date.now(),
          isTranslated,
          location: location.location
        });
      }

      onClose();
    } catch (error) {
      console.error('Error handling back navigation:', error);
      onClose();
    }
  };

  // Generate a unique ID for the book
  useEffect(() => {
    if (file) {
      const id = generateBookId(file);
      setBookId(id);
    }
  }, [file]);

  // Load bookmarks and highlights
  useEffect(() => {
    if (bookId) {
      const loadBookmarksAndHighlights = async () => {
        try {
          const loadedBookmarks = await getBookmarks(bookId);
      setBookmarks(loadedBookmarks);
      
          // Get current translation state
          const translateElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
          const isTranslated = translateElement?.value ? translateElement.value !== 'original' : false;
          
          const loadedHighlights = await getHighlights(bookId, isTranslated);
      setHighlights(loadedHighlights);
        } catch (error) {
          console.error('Error loading bookmarks and highlights:', error);
        }
      };
      
      loadBookmarksAndHighlights();
    }
  }, [bookId]);

  // Load reader settings
  useEffect(() => {
    const settings = getReaderSettings();
    setReaderSettings(settings);
  }, []);

  // Apply reader settings to rendition
  useEffect(() => {
    if (rendition && rendition.display) {
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
        if (currentLocation?.start?.cfi) {
          rendition.display(currentLocation.start.cfi);
        }
        
        // Save settings to localStorage
        saveReaderSettings(readerSettings);
      } catch (err) {
        console.error("Error applying reader settings:", err);
      }
    }
  }, [rendition, readerSettings]);

  // Apply highlights when rendition or highlights change
  useEffect(() => {
    if (rendition && highlights.length > 0) {
      // First remove all existing highlights to avoid duplicates
      try {
        rendition.annotations.clear();
      } catch (err) {
        console.error("Error clearing annotations:", err);
      }
      
      // Then add all highlights
      highlights.forEach(highlight => {
        try {
          rendition.annotations.add(
            "highlight", 
            highlight.cfi, 
            {}, 
            undefined, 
            "hl", 
            { 
              fill: highlight.color + "80",
              onClick: () => handleHighlightClick(highlight)
            }
          );
        } catch (err) {
          console.error("Error adding highlight:", err);
        }
      });
    }
  }, [rendition, highlights]);

  // Reload highlights when translation state changes
  useEffect(() => {
    const translateElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (!translateElement) return;

    const handleTranslationChange = async () => {
      if (!bookId) return;
      
      try {
        const isTranslated = translateElement.value !== 'original';
        const loadedHighlights = await getHighlights(bookId, isTranslated);
        setHighlights(loadedHighlights);
        
        // Reapply highlights to rendition
        if (rendition) {
          rendition.annotations.clear();
          loadedHighlights.forEach(highlight => {
            try {
              rendition.annotations.add(
                "highlight", 
                highlight.cfi, 
                {}, 
                undefined, 
                "hl", 
                { 
                  fill: highlight.color + "80",
                  onClick: () => handleHighlightClick(highlight)
                }
              );
            } catch (err) {
              console.error("Error adding highlight:", err);
            }
          });
        }
      } catch (error) {
        console.error('Error reloading highlights:', error);
      }
    };

    translateElement.addEventListener('change', handleTranslationChange);
    return () => translateElement.removeEventListener('change', handleTranslationChange);
  }, [bookId, rendition]);

  useEffect(() => {
    let bookInstance: any = null;
    let fileUrl: string | null = null;

    const loadBook = async () => {
      if (!file || !viewerRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        fileUrl = URL.createObjectURL(file);
        console.log("Created file URL:", fileUrl);
        
        bookInstance = ePub(fileUrl, {
          openAs: 'epub'
        });
        setBook(bookInstance);
        console.log("Book instance created");

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

        // Generate locations before getting progress
          try {
            await bookInstance.locations.generate(1024);
            console.log("Locations generated");
          } catch (locErr) {
            console.error("Error generating locations:", locErr);
        }

        // Get the current language from Google Translate
        const translateElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        const isTranslated = translateElement?.value ? translateElement.value !== 'original' : false;
        
        // Get progress based on translation state
        const progress = getReadingProgress(generateBookId(file), isTranslated);
        
        // Display the book at the exact saved position
        try {
          if (progress?.cfi && progress?.percentage) {
            console.log("Restoring position:", progress.cfi, "percentage:", progress.percentage, "isTranslated:", isTranslated);
            
            // Set initial location state before displaying
            setLocation({
              cfi: progress.cfi,
              href: progress.href || '',
              percentage: progress.percentage,
              location: progress.location || 0
            });

            // Calculate the CFI for the saved percentage
            let targetCfi = progress.cfi;
            try {
              if (bookInstance.locations && bookInstance.locations.cfiFromPercentage) {
                // Convert percentage back to decimal for calculation
                const calculatedCfi = bookInstance.locations.cfiFromPercentage(progress.percentage / 100);
                if (calculatedCfi) {
                  targetCfi = calculatedCfi;
                  console.log("Using calculated CFI from percentage:", targetCfi, "percentage:", progress.percentage);
                }
              }
            } catch (cfiErr) {
              console.error("Error calculating CFI from percentage:", cfiErr);
            }

            // Display at the calculated position
            await newRendition.display(targetCfi);
          } else {
            console.log("Starting from beginning");
            await newRendition.display();
          }
          
          setIsLoading(false);
        } catch (displayErr) {
          console.error("Error displaying book:", displayErr);
          setError("Failed to display the book. The EPUB file may be corrupted or in an unsupported format.");
          setIsLoading(false);
        }

        // Track location changes with improved accuracy
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
                // Convert to percentage with 2 decimal places
                percentage = parseFloat((percentage * 100).toFixed(2));
              }
            } catch (err) {
              console.error("Error calculating percentage:", err);
            }
            
            const locationObj = {
              cfi,
              href,
              percentage: percentage || 0,
              location: currentLocation.start.location || 0,
            };
            
            setLocation(locationObj);
            
            // Check if current page is bookmarked
            checkIfCurrentPageBookmarked(cfi);
            
            // Get current translation state
            const translateElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
            const isTranslated = translateElement?.value ? translateElement.value !== 'original' : false;
            
            // Save detailed reading progress
            saveReadingProgress(generateBookId(file), {
              ...locationObj,
              lastRead: Date.now(),
              isTranslated
            });
            
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
              setCurrentSelection({
                cfiRange,
                text,
                contents
              });
              
              // Hide translate menu if it's showing
              setShowTranslateMenu(false);
              
              // Hide Google Translate popup
              const googlePopup = document.querySelector('.goog-te-banner-frame') as HTMLElement;
              if (googlePopup) {
                googlePopup.style.display = 'none';
              }
              
              // Minimize Google Translate widget
              const translateElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
              if (translateElement) {
                translateElement.style.transform = 'scale(0.1)';
                translateElement.style.opacity = '0.1';
                // Restore after highlight menu closes
                setTimeout(() => {
                  translateElement.style.transform = 'scale(0.75)';
                  translateElement.style.opacity = '1';
                }, 2000);
              }
              
              // Show highlight menu instead
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              
              if (rect) {
                const iframe = contents.window.document.defaultView.frameElement;
                if (iframe) {
                  const iframeRect = iframe.getBoundingClientRect();
                  
                  // Position the menu at the center of the selection
                  setMenuPosition({
                    x: iframeRect.left + (rect.left + rect.right) / 2,
                    y: rect.bottom + iframeRect.top
                  });
                  setShowHighlightMenu(true);
                }
              }
            }
          } catch (err) {
            console.error("Error in selected handler:", err);
          }
        });

        // Handle click events to hide menus when clicking elsewhere
        newRendition.on('click', () => {
          setShowHighlightMenu(false);
          setShowTranslateMenu(false);
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

  // Add function to check if current page is bookmarked
  const checkIfCurrentPageBookmarked = (currentCfi: string) => {
    const isBookmarked = bookmarks.some(bookmark => bookmark.cfi === currentCfi);
    setIsCurrentPageBookmarked(isBookmarked);
  };

  // Modify addBookmark function
  const addBookmark = async () => {
    if (!location || !bookId) return;
    
    try {
      if (isCurrentPageBookmarked) {
        // Remove bookmark if already exists
        await removeBookmark(bookId, location.cfi);
        setBookmarks(bookmarks.filter(b => b.cfi !== location.cfi));
        setIsCurrentPageBookmarked(false);
      } else {
        // Add new bookmark
    const newBookmark: Bookmark = {
      cfi: location.cfi,
      href: location.href,
      text: `Page ${location.percentage}%`,
      chapter: currentChapter,
      createdAt: Date.now()
    };
    
        await saveBookmark(bookId, newBookmark);
    setBookmarks([...bookmarks, newBookmark]);
        setIsCurrentPageBookmarked(true);
      }
    } catch (error) {
      console.error('Error managing bookmark:', error);
    }
  };

  // Modify handleBookmarkClick
  const handleBookmarkClick = (bookmark: Bookmark) => {
    if (rendition && book) {
      try {
        // Extract percentage from bookmark text (format: "Page XX%")
        const percentageMatch = bookmark.text.match(/(\d+(\.\d+)?)%/);
        if (percentageMatch && book.locations) {
          const percentage = parseFloat(percentageMatch[1]);
          console.log("Attempting to navigate to percentage:", percentage);

          // Ensure locations are generated
          if (!book.locations.total) {
            console.log("Generating locations...");
            book.locations.generate(1024).then(() => {
              navigateToPercentage(percentage);
            });
          } else {
            navigateToPercentage(percentage);
          }
        } else {
          console.log("Using original bookmark CFI:", bookmark.cfi);
        rendition.display(bookmark.cfi);
        }
        
        setShowSidebar(false);
      } catch (err) {
        console.error("Error navigating to bookmark:", err);
        // Fallback to original CFI if anything fails
        try {
          rendition.display(bookmark.cfi);
          setShowSidebar(false);
        } catch (fallbackErr) {
          console.error("Error using fallback navigation:", fallbackErr);
        }
      }
    }
  };

  // Add helper function for percentage navigation
  const navigateToPercentage = async (percentage: number) => {
    if (!book || !rendition || !book.locations || !book.locations.total) {
      console.error('Cannot navigate: book or locations not ready');
      return;
    }

    try {
      // Ensure percentage is between 0 and 100
      const validPercentage = Math.max(0, Math.min(100, percentage));
      console.log('Navigating to percentage:', validPercentage);

      // Get the CFI for this percentage
      const decimal = validPercentage / 100;
      const cfi = book.locations.cfiFromPercentage(decimal);
      
      if (!cfi) {
        console.error('Failed to get CFI for percentage:', validPercentage);
        return;
      }

      // Navigate to the CFI
      await rendition.display(cfi);
    } catch (error) {
      console.error('Error navigating to percentage:', error);
    }
  };

  const handleHighlightClick = async (highlight: Highlight) => {
    if (!rendition || !book) return;

    // Close sidebar immediately
        setShowSidebar(false);

    try {
      // Ensure we have locations generated
      if (!book.locations || !book.locations.total) {
        console.log("Generating locations...");
        await book.locations.generate(1024);
      }

      // Use the CFI for initial navigation
      if (highlight.cfi) {
        console.log("Navigating to highlight CFI:", highlight.cfi);
        
        // Navigate using CFI first
        await rendition.display(highlight.cfi);
        
        // Wait a moment for the navigation to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Then verify and adjust if needed
        const currentLocation = rendition.currentLocation();
        if (currentLocation?.start) {
          const actualPercentage = book.locations.percentageFromCfi(currentLocation.start.cfi);
          console.log("Actual percentage:", actualPercentage * 100, "Expected:", highlight.percentage);
          
          // If we're not at the correct percentage, adjust
          if (Math.abs((actualPercentage * 100) - highlight.percentage) > 0.5) {
            console.log("Position mismatch, adjusting to correct percentage");
            await navigateToPercentage(highlight.percentage);
          }
        }
      } else if (typeof highlight.percentage === 'number') {
        // Fallback to percentage navigation if no CFI
        console.log("No CFI available, using percentage:", highlight.percentage);
        await navigateToPercentage(highlight.percentage);
      }
      } catch (err) {
        console.error("Error navigating to highlight:", err);
      // If navigation fails, try one last time with percentage
      try {
        if (typeof highlight.percentage === 'number') {
          await navigateToPercentage(highlight.percentage);
        }
      } catch (fallbackErr) {
        console.error("Error in fallback navigation:", fallbackErr);
      }
    }
  };

  const handleHighlightDelete = async (cfi: string) => {
    if (!bookId) return;
    
    try {
      // Get current translation state
      const translateElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      const isTranslated = translateElement?.value ? translateElement.value !== 'original' : false;
      
      await removeHighlight(bookId, cfi, isTranslated);
    
    // Update local state
    setHighlights(highlights.filter(h => h.cfi !== cfi));
    
    // Remove highlight from rendition
    if (rendition) {
        rendition.annotations.remove(cfi, "highlight");
      }
      } catch (err) {
      console.error("Error removing highlight:", err);
    }
  };

  const handleSettingsChange = (newSettings: ReaderSettingsType) => {
    setReaderSettings(newSettings);
  };

  const handleSearch = async () => {
    if (!book || !searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // Ensure locations are generated before searching
      if (!book.locations || !book.locations.total) {
        console.log("Generating locations before search...");
        await book.locations.generate(1024);
      }

      // Normalize search query
      const normalizedQuery = searchQuery.trim().toLowerCase();
      console.log("Searching for:", normalizedQuery);

      // Search in each spine item
      const allResults = [];
      const spineItems = book.spine.items;
      
      for (let item of spineItems) {
        try {
          const itemResults = await book.spine.get(item.href).load(book.load.bind(book));
          const content = itemResults.content || itemResults;
          
          if (content) {
            const text = content.textContent || '';
            const normalizedText = text.toLowerCase();
            let index = normalizedText.indexOf(normalizedQuery);
            
            while (index !== -1) {
              // Get surrounding context (100 characters before and after)
              const start = Math.max(0, index - 100);
              const end = Math.min(text.length, index + normalizedQuery.length + 100);
              const excerpt = text.slice(start, end).trim();
              
              // Get CFI for this position
              const cfi = item.cfiFromRange(index, index + normalizedQuery.length);
              
              if (cfi) {
                allResults.push({
                  cfi,
                  excerpt,
                  percentage: book.locations.percentageFromCfi(cfi)
                });
              }
              
              index = normalizedText.indexOf(normalizedQuery, index + 1);
            }
          }
        } catch (err) {
          console.error("Error searching in spine item:", err);
        }
      }

      // Sort results by percentage
      const sortedResults = allResults.sort((a, b) => (a.percentage || 0) - (b.percentage || 0));
      
      console.log("Found results:", sortedResults.length);
      setSearchResults(sortedResults);
    } catch (err) {
      console.error("Error searching:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const goToSearchResult = async (cfi: string) => {
    if (!rendition || !book) return;

    try {
      console.log("Navigating to search result CFI:", cfi);
      
      // First try using the CFI directly
      await rendition.display(cfi);
      
      // Get the current location after navigation
      const currentLocation = rendition.currentLocation();
      if (currentLocation?.start) {
        // Calculate percentage for the current position
        const percentage = book.locations.percentageFromCfi(currentLocation.start.cfi);
        console.log("Search result percentage:", percentage * 100);
        
        // Update location state
        const locationObj = {
          cfi: currentLocation.start.cfi,
          href: currentLocation.start.href || '',
          percentage: parseFloat((percentage * 100).toFixed(2)),
          location: currentLocation.start.location || 0
        };
        setLocation(locationObj);

        // Get current translation state
        const translateElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        const isTranslated = translateElement?.value ? translateElement.value !== 'original' : false;
        
        // Save reading progress
        saveReadingProgress(bookId, {
          ...locationObj,
          lastRead: Date.now(),
          isTranslated
        });
      }

      // Close sidebar after successful navigation
      setShowSidebar(false);
      
      // Highlight the search result
      rendition.annotations.highlight(cfi, {}, (e: Event) => {
        // Remove the highlight after a delay
        setTimeout(() => {
          rendition.annotations.remove(cfi, "highlight");
        }, 2000);
      });
    } catch (err) {
      console.error("Error navigating to search result:", err);
      
      // Try alternative navigation if direct CFI fails
      try {
        const spineItem = book.spine.get(cfi);
        if (spineItem) {
          await rendition.display(spineItem.href);
          setShowSidebar(false);
        }
      } catch (fallbackErr) {
        console.error("Error in fallback navigation:", fallbackErr);
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

  // Handle Highlight Function
  const handleHighlight = async (color: string) => {
    if (!currentSelection || !bookId || !location) return;
    
    const { cfiRange, text } = currentSelection;
    
    // Get current translation state
    const translateElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    const isTranslated = translateElement?.value ? translateElement.value !== 'original' : false;
    
    // Create highlight object with percentage
    const newHighlight: Highlight = {
      cfi: cfiRange,
      text,
      color,
      chapter: currentChapter,
      createdAt: Date.now(),
      percentage: location.percentage // Add percentage from current location
    };
    
    try {
      // Save to localStorage with translation state
      await saveHighlight(bookId, newHighlight, isTranslated);
    
    // Update local state
    setHighlights([...highlights, newHighlight]);
    
    // Apply highlight to rendition
    if (rendition) {
        rendition.annotations.add(
          "highlight", 
          cfiRange, 
          {}, 
          undefined, 
          "hl", 
          { 
            fill: color + "80",
            onClick: () => handleHighlightClick(newHighlight)
          }
        );
      }
      } catch (err) {
      console.error("Error saving highlight:", err);
    }
    
    // Hide menu
    setShowHighlightMenu(false);
  };

  // Handle Copy Function
  const handleCopy = () => {
    if (currentSelection) {
      navigator.clipboard.writeText(currentSelection.text)
        .then(() => {
          console.log('Text copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
        });
      
      setShowHighlightMenu(false);
    }
  };

  // Handle Search for selected text
  const handleSearchSelected = () => {
    if (currentSelection) {
      setSearchQuery(currentSelection.text);
      setSidebarContent('search');
      setShowSidebar(true);
      setShowHighlightMenu(false);
      
      // Trigger search after state updates
      setTimeout(() => {
        handleSearch();
      }, 100);
    }
  };

  return (
    <div 
      className={`flex flex-col h-screen ${readerSettings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}
      tabIndex={0} 
      onKeyDown={handleKeyDown}
    >
      <style jsx global>{`
        .goog-te-banner-frame {
          display: none !important;
        }
        .goog-te-combo {
          transition: all 0.3s ease-in-out !important;
        }
        .skiptranslate {
          opacity: 1;
          transition: opacity 0.3s ease-in-out;
        }
        .skiptranslate.minimized {
          opacity: 0.1;
        }
      `}</style>
      {/* Header */}
      <header className={`flex items-center justify-between p-4 ${readerSettings.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white shadow-sm'}`}>
        <div className="flex items-center">
          <button 
            onClick={handleBack}
            className={`p-2 rounded-md ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} mr-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            aria-label="Back to library"
          >
            <ArrowLeft className="w-5 h-5" />
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
          {location ? `${location.percentage}%` : '0%'}
        </h1>
        
        {/* Google Translate Element - Positioned in the header */}
        <div className="flex items-center">
          <div id="google_translate_element" className="mr-2 scale-75 origin-right"></div>
          
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => toggleSidebar('search')}
              className={`p-2 rounded-md ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${showSidebar && sidebarContent === 'search' ? 'bg-blue-100 text-blue-600' : ''}`}
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <button 
              onClick={addBookmark}
              className={`p-2 rounded-md transition-colors duration-200 ${
                isCurrentPageBookmarked 
                  ? 'text-red-500 hover:bg-red-50' 
                  : readerSettings.theme === 'dark' 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
              aria-label={isCurrentPageBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <BookmarkIcon size={18} className={isCurrentPageBookmarked ? "fill-current" : ""} />
            </button>
            <button 
              onClick={() => toggleSidebar('bookmarks')}
              className={`p-2 rounded-md ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${showSidebar && sidebarContent === 'bookmarks' ? 'bg-blue-100 text-blue-600' : ''}`}
              aria-label="Bookmarks"
            >
              <BookmarkIcon size={18} className="fill-current" />
            </button>
            <button 
              onClick={() => toggleSidebar('highlights')}
              className={`p-2 rounded-md ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${showSidebar && sidebarContent === 'highlights' ? 'bg-blue-100 text-blue-600' : ''}`}
              aria-label="Highlights"
            >
              <Highlighter size={18} />
            </button>
            <button 
              onClick={() => toggleSidebar('settings')}
              className={`p-2 rounded-md ${readerSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${showSidebar && sidebarContent === 'settings' ? 'bg-blue-100 text-blue-600' : ''}`}
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
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
              
              {sidebarContent === 'highlights' && (
                <div>
                  <h2 className="text-lg font-medium mb-4">Highlights</h2>
                  <HighlightsList 
                    highlights={highlights} 
                    onHighlightClick={handleHighlightClick} 
                    onHighlightDelete={handleHighlightDelete} 
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

      {/* Highlight menu */}
      {showHighlightMenu && (
        <HighlightMenu
          onHighlight={handleHighlight}
          onCopy={handleCopy}
          onSearch={handleSearchSelected}
          position={menuPosition}
        />
      )}
    </div>
  );
};

export default Reader;