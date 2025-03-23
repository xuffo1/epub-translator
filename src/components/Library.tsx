import React, { useState, useEffect } from 'react';
import { Book } from 'lucide-react';
import FileUploader from './FileUploader';
import { getAllBooks, saveBook, saveBookFile, extractBookMetadata, deleteBook, getBook } from '../services/storageService';
import { Book as BookType } from '../types';

interface LibraryProps {
  onBookSelected: (file: File) => void;
}

const Library: React.FC<LibraryProps> = ({ onBookSelected }) => {
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingBook, setAddingBook] = useState(false);

  // Load books when component mounts
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const loadedBooks = await getAllBooks();
      setBooks(loadedBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelected = async (file: File) => {
    try {
      setAddingBook(true);
      
      // Generate unique ID for the book
      const bookId = `${file.name}-${file.size}-${file.lastModified}`;
      
      // Create initial book object
      const newBook: BookType = {
        id: bookId,
        title: file.name.replace('.epub', ''),
        addedAt: Date.now(),
        file
      };
      
      // Extract metadata and save file
      const arrayBuffer = await file.arrayBuffer();
      const { title, author, coverUrl } = await extractBookMetadata(arrayBuffer);
      
      // Update book with metadata
      if (title) newBook.title = title;
      if (author) newBook.author = author;
      if (coverUrl) newBook.coverUrl = coverUrl;
      
      // Save book data
      await Promise.all([
        saveBookFile(bookId, arrayBuffer),
        saveBook(newBook)
      ]);
      
      // Update books list
      setBooks(prevBooks => [newBook, ...prevBooks]);
    } catch (error) {
      console.error('Error adding book:', error);
    } finally {
      setAddingBook(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      await deleteBook(bookId);
      setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const handleBookClick = async (bookId: string) => {
    try {
      // Get the currently selected language from Google Translate
      const translateElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      const selectedLanguage = translateElement?.value || 'original';

      // Get book with language-specific configuration
      const book = await getBook(bookId, { language: selectedLanguage });
      
      if (book && book.file) {
        onBookSelected(book.file);
      }
    } catch (error) {
      console.error('Error opening book:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">My Books</h2>
        <FileUploader onFileLoaded={handleFileSelected} />
      </div>

      {loading || addingBook ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No Books in Cache</h3>
          <p className="text-sm text-gray-500 mt-2">
            Add some books to start reading
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => handleBookClick(book.id)}
            >
              {/* Cover Image */}
              <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Book className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBook(book.id);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-gray-600 hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Book Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate">
                  {book.title}
                </h3>
                {book.author &&
                  <p className="mt-1 text-sm text-gray-500 truncate">
                    {book.author}
                  </p>
                }
                <div className="mt-2 text-xs text-gray-400">
                  Added {new Date(book.addedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;