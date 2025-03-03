import React, { useState, useEffect } from 'react';
import { Book, Clock, User, Trash2 } from 'lucide-react';
import FileUploader from './FileUploader';
import { 
  getRecentBooks, 
  addRecentBook, 
  generateBookId, 
  getReadingProgress, 
  removeRecentBook 
} from '../services/storageService';

interface LibraryProps {
  onBookSelected: (file: File) => void;
}

interface StoredBookInfo {
  id: string;
  name: string;
  size: number;
  lastOpened: number;
  author?: string;
  coverUrl?: string;
}

const Library: React.FC<LibraryProps> = ({ onBookSelected }) => {
  const [recentBooks, setRecentBooks] = useState<StoredBookInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Load recent books from localStorage on component mount
  useEffect(() => {
    try {
      const storedBooks = getRecentBooks();
      setRecentBooks(storedBooks);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading recent books:", err);
      setIsLoading(false);
    }
  }, []);

  const handleFileLoaded = async (file: File) => {
    console.log("File loaded in Library component:", file.name);
    
    // Create a unique ID for the book
    const bookId = generateBookId(file);
    
    // Add to recent books
    const bookInfo = {
      id: bookId,
      name: file.name,
      size: file.size,
      lastOpened: Date.now(),
    };
    
    addRecentBook(bookInfo);
    
    // Update the local state
    setRecentBooks(prevBooks => {
      // Remove if already exists
      const filteredBooks = prevBooks.filter(book => book.id !== bookId);
      // Add to beginning of array
      return [bookInfo, ...filteredBooks].slice(0, 10); // Keep only 10 most recent
    });
    
    onBookSelected(file);
  };

  const handleDeleteBook = (bookId: string) => {
    // Show confirmation dialog
    setShowDeleteConfirm(bookId);
  };

  const confirmDeleteBook = (bookId: string) => {
    // Remove from localStorage
    removeRecentBook(bookId);
    
    // Update local state
    setRecentBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
    
    // Hide confirmation dialog
    setShowDeleteConfirm(null);
  };

  const cancelDeleteBook = () => {
    // Hide confirmation dialog
    setShowDeleteConfirm(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise show date
    return date.toLocaleDateString();
  };

  const getReadingProgressForBook = (bookId: string) => {
    const progress = getReadingProgress(bookId);
    return progress ? progress.percentage : 0;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Upload an EPUB</h2>
        <FileUploader onFileLoaded={handleFileLoaded} />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
      ) : recentBooks.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Recent Books</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentBooks.map((book) => {
              const progress = getReadingProgressForBook(book.id);
              return (
                <div
                  key={book.id}
                  className="flex flex-col border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white relative"
                >
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                    aria-label="Delete book"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="p-4 flex items-center">
                    <Book className="w-12 h-12 text-blue-500 mr-3 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <h3 className="font-medium text-gray-800 truncate">
                        {book.name.replace('.epub', '')}
                      </h3>
                      {book.author && (
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <User className="w-3 h-3 mr-1" />
                          {book.author}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(book.lastOpened)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  {progress > 0 && (
                    <div className="px-4 pb-3">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">{progress}% read</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      // Create a File object from the stored info
                      // Note: This is a mock implementation since we can't recreate the actual file
                      // In a real app, you would need to store the file or its contents
                      const mockFile = new File(
                        [new ArrayBuffer(0)], // Empty content as placeholder
                        book.name,
                        { type: 'application/epub+zip', lastModified: book.lastOpened }
                      );
                      onBookSelected(mockFile);
                    }}
                    className="mt-auto py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    Continue Reading
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Book className="w-16 h-16 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-medium text-gray-700">No Recent Books</h3>
          <p className="text-sm text-gray-500 mt-1">
            Upload an EPUB file to start reading
          </p>
        </div>
      )}
      
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>Upload your EPUB files to read them with translation capabilities.</p>
        <p className="mt-1">Your books are stored locally and never uploaded to any server.</p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Book</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this book from your library? This will also remove all bookmarks and reading progress.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteBook}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDeleteBook(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;