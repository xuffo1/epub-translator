import React, { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';
import { X, ChevronLeft, ChevronRight, Settings, Loader2, Languages } from 'lucide-react';

interface EpubReaderProps {
  file: File;
  onClose: () => void;
}

const EpubReader: React.FC<EpubReaderProps> = ({ file, onClose }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [rendition, setRendition] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<number>(0);
  const [totalLocations, setTotalLocations] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<any>(null);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [fontSize, setFontSize] = useState(100);

  const toggleGoogleTranslate = () => {
    const frame = document.querySelector('.goog-te-menu-frame') as HTMLIFrameElement;
    if (frame) {
      frame.style.display = frame.style.display === 'none' ? 'block' : 'none';
    }
  };

  useEffect(() => {
    if (!viewerRef.current) return;

    const initializeReader = async () => {
      try {
        setIsLoading(true);
        const newBook = ePub(file);
        setBook(newBook);
        
        const rendition = newBook.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          spread: 'none',
          flow: 'paginated',
          manager: 'default'
        });

        rendition.themes.fontSize(`${fontSize}%`);

        await rendition.display();
        setRendition(rendition);

        try {
          await newBook.locations.generate(1024);
          const length = newBook.locations.length();
          setTotalLocations(length || 0);
        } catch (err) {
          console.warn('Failed to generate locations:', err);
          setTotalLocations(0);
        }

        rendition.on('locationChanged', (location: any) => {
          try {
            const currentLoc = newBook.locations.locationFromCfi(location.start.cfi);
            setCurrentLocation(currentLoc || 0);
          } catch (err) {
            console.warn('Failed to update location:', err);
          }
        });

        rendition.hooks.content.register((contents: any) => {
          const document = contents.window.document;
          const window = contents.window;

          const style = document.createElement('style');
          style.innerHTML = `
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              line-height: 1.6;
              padding: 0 20px;
              margin: 0;
            }
            * {
              max-width: 100%;
            }
          `;
          document.head.appendChild(style);

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
                  setMenuPosition({
                    x: rect.left + iframeRect.left + (rect.width / 2),
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

        const handleResize = () => {
          if (viewerRef.current) {
            rendition.resize(viewerRef.current.clientWidth, viewerRef.current.clientHeight);
          }
        };
        window.addEventListener('resize', handleResize);

        const handleClickOutside = (e: MouseEvent) => {
          const target = e.target as Element;
          if (!target.closest('.translate-menu') && !target.closest('iframe')) {
            setShowTranslateMenu(false);
          }
        };
        document.addEventListener('click', handleClickOutside);

        setIsLoading(false);

        return () => {
          window.removeEventListener('resize', handleResize);
          document.removeEventListener('click', handleClickOutside);
          rendition.destroy();
        };
      } catch (err) {
        setError('Failed to load the book. Please try again.');
        setIsLoading(false);
      }
    };

    initializeReader();
  }, [file, fontSize]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    document.addEventListener('keyup', handleKeyPress);
    return () => document.removeEventListener('keyup', handleKeyPress);
  }, []);

  const handleNext = () => {
    if (rendition) {
      rendition.next();
    }
  };

  const handlePrev = () => {
    if (rendition) {
      rendition.prev();
    }
  };

  const handleTranslate = (targetLang: string) => {
    const encodedText = encodeURIComponent(selectedText);
    window.open(
      `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodedText}&op=translate`,
      '_blank'
    );
    setShowTranslateMenu(false);
  };

  const adjustFontSize = (delta: number) => {
    const newSize = fontSize + delta;
    if (newSize >= 50 && newSize <= 200) {
      setFontSize(newSize);
      if (rendition) {
        rendition.themes.fontSize(`${newSize}%`);
      }
    }
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Close Reader
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close reader"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustFontSize(-10)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              A-
            </button>
            <span className="text-sm text-gray-600">{fontSize}%</span>
            <button
              onClick={() => adjustFontSize(10)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              A+
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {totalLocations > 0 ? `${currentLocation} of ${totalLocations}` : 'Reading'}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleGoogleTranslate}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          >
            <Languages className="w-5 h-5" />
            <span>Translate</span>
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}
        
        <div className="absolute inset-y-0 left-0 flex items-center z-10">
          <button
            onClick={handlePrev}
            className="p-3 m-4 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <div ref={viewerRef} className="h-full bg-white" />
        
        <div className="absolute inset-y-0 right-0 flex items-center z-10">
          <button
            onClick={handleNext}
            className="p-3 m-4 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Next page"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {showTranslateMenu && (
          <div 
            className="translate-menu fixed bg-white rounded-lg shadow-xl p-2 z-50"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y + 10}px`,
              transform: 'translateX(-50%)'
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
    </div>
  );
};

export default EpubReader;