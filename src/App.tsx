import React, { useState } from 'react';
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Google Translate Element */}
      <div id="google_translate_element" className="fixed top-4 right-4 z-50"></div>
      
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