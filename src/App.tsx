import React, { useState, useEffect } from 'react';
import Library from './components/Library';
import Reader from './components/Reader';
import { Book } from 'lucide-react';

function App() {
  const [selectedBook, setSelectedBook] = useState<File | null>(null);

  const handleBookSelected = (file: File) => {
    setSelectedBook(file);
  };

  const handleCloseReader = () => {
    setSelectedBook(null);
  };

  // Initialize Google Translate when component mounts
  useEffect(() => {
    // Reinitialize Google Translate when switching between Reader and Library
    if (window.google && window.google.translate) {
      try {
        const translateElement = document.getElementById('google_translate_element');
        if (translateElement) {
          translateElement.innerHTML = '';
          new window.google.translate.TranslateElement({
            pageLanguage: 'auto',
            includedLanguages: 'zh-CN,es,en,hi,ar,bn,pt,ru,ja,pa,de,jv,wu,ko,fr,te,vi,mr,ta,tr,ur,it,yue,th,gu,jin,fa,pl,uk,ro',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
          }, 'google_translate_element');
        }
      } catch (e) {
        console.error('Error reinitializing Google Translate:', e);
      }
    }
  }, [selectedBook]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Google Translate Element - Only visible on Library page */}
      {!selectedBook && (
        <div id="google_translate_element" className="fixed top-4 right-4 z-50"></div>
      )}
      
      {selectedBook ? (
        <Reader file={selectedBook} onClose={handleCloseReader} />
      ) : (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <Book className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">EPUB Reader</h1>
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