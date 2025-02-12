import React, { useState, useRef } from 'react';
import { Book, Upload } from 'lucide-react';
import EpubReader from './components/EpubReader';

function App() {
  const [book, setBook] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/epub+zip') {
      setBook(file);
    } else {
      alert('Please select a valid EPUB file');
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/epub+zip') {
      setBook(file);
    } else {
      alert('Please drop a valid EPUB file');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div id="google_translate_element" className="fixed top-4 right-4 z-50"></div>
      
      {!book ? (
        <div 
          className="min-h-screen flex flex-col items-center justify-center p-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
            <Book className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-2xl font-bold mb-4">EPUB Reader</h1>
            <p className="text-gray-600 mb-6">
              Upload your EPUB books and read them with translation support
            </p>
            <input
              type="file"
              accept=".epub"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />
              Select EPUB File
            </button>
            <p className="mt-4 text-sm text-gray-500">
              Or drag and drop your EPUB file here
            </p>
          </div>
        </div>
      ) : (
        <EpubReader file={book} onClose={() => setBook(null)} />
      )}
    </div>
  );
}

export default App;