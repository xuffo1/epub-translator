import React, { useState, useEffect } from 'react';
import Library from './components/Library';
import Reader from './components/Reader';
import { Book } from 'lucide-react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

function App() {
  const [selectedBook, setSelectedBook] = useState<File | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => 
    localStorage.getItem('preferredLanguage') || 'original'
  );

  const handleBookSelected = (file: File) => {
    setSelectedBook(file);
  };

  const handleCloseReader = () => {
    // Get current language before closing
    const translateElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (translateElement) {
      const currentLanguage = translateElement.value;
      setSelectedLanguage(currentLanguage);
      localStorage.setItem('preferredLanguage', currentLanguage);
    }
    setSelectedBook(null);
  };

  // Initialize Google Translate
  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;
    let mounted = true;

    const initializeTranslate = () => {
      try {
        if (!window.google || !window.google.translate) {
          console.warn('Google Translate not available yet');
          return;
        }

        const translateElement = document.getElementById('google_translate_element');
        if (!translateElement) {
          console.warn('Translation element not found');
          return;
        }

        translateElement.innerHTML = '';

        const translateInstance = new window.google.translate.TranslateElement(
          {
            pageLanguage: 'auto',
            includedLanguages: 'zh-CN,es,en,hi,ar,bn,pt,ru,ja,pa,de,jv,wu,ko,fr,te,vi,mr,ta,tr,ur,it,yue,th,gu,jin,fa,pl,uk,ro',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );

        // Restaurar el idioma seleccionado previamente
        if (selectedLanguage && selectedLanguage !== 'original') {
          setTimeout(() => {
            const comboBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
            if (comboBox) {
              comboBox.value = selectedLanguage;
              comboBox.dispatchEvent(new Event('change'));
            }
          }, 1000);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error initializing translate:', error);
          setTranslateError('Failed to initialize translator');
        }
      }
    };

    // Only initialize if we're on the library page
    if (!selectedBook) {
      try {
        // Remove any existing instances
        const existingScript = document.getElementById('google-translate-script');
        if (existingScript) {
          existingScript.remove();
        }

        // Reset error state
        setTranslateError(null);

        // Create initialization function
        window.googleTranslateElementInit = () => {
          if (mounted) {
            initializeTranslate();
          }
        };

        // Create and append the script
        scriptElement = document.createElement('script');
        scriptElement.id = 'google-translate-script';
        scriptElement.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        scriptElement.async = true;
        scriptElement.onerror = () => {
          if (mounted) {
            console.error('Failed to load Google Translate script');
            setTranslateError('Failed to load translator');
          }
        };

        document.body.appendChild(scriptElement);
      } catch (error) {
        console.error('Error setting up translate:', error);
        setTranslateError('Failed to setup translator');
      }

      // Cleanup function
      return () => {
        mounted = false;
        if (scriptElement && scriptElement.parentNode) {
          scriptElement.parentNode.removeChild(scriptElement);
        }
        if (window.googleTranslateElementInit) {
          delete window.googleTranslateElementInit;
        }
        const translateElement = document.getElementById('google_translate_element');
        if (translateElement) {
          translateElement.innerHTML = '';
        }
      };
    }
  }, [selectedBook, selectedLanguage]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Google Translate Element - Only visible on Library page */}
      {!selectedBook && (
        <>
          <div id="google_translate_element" className="fixed top-4 right-4 z-50">
            {translateError && (
              <div className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                {translateError}
              </div>
            )}
          </div>
        </>
      )}
      
      {selectedBook ? (
        <Reader file={selectedBook} onClose={handleCloseReader} />
      ) : (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <Book className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">Epub Translator</h1>
            </div>
          </div>
          
          {/* Library content */}
          <Library onBookSelected={handleBookSelected} />
        </div>
      )}
    </div>
  );
}

export default App;