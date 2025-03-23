import React from 'react';
import { Bookmark } from '../types';
import { Bookmark as BookmarkIcon, Trash2 } from 'lucide-react';

interface BookmarksListProps {
  bookmarks: Bookmark[];
  onBookmarkClick: (bookmark: Bookmark) => void;
  onBookmarkDelete: (cfi: string) => Promise<void>;
}

const BookmarksList: React.FC<BookmarksListProps> = ({ 
  bookmarks, 
  onBookmarkClick, 
  onBookmarkDelete 
}) => {
  // Sort bookmarks by creation time (newest first)
  const sortedBookmarks = [...bookmarks].sort((a, b) => b.createdAt - a.createdAt);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = async (cfi: string) => {
    try {
      await onBookmarkDelete(cfi);
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  if (bookmarks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <BookmarkIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No bookmarks yet</p>
        <p className="text-sm mt-1">Add bookmarks while reading to see them here</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {sortedBookmarks.map((bookmark) => (
        <div key={bookmark.cfi} className="p-3 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <button
              onClick={() => onBookmarkClick(bookmark)}
              className="flex-1 text-left"
            >
              <div className="flex items-center">
                <BookmarkIcon className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                <span className="font-medium text-sm line-clamp-2">{bookmark.text}</span>
              </div>
              {bookmark.chapter && (
                <p className="text-xs text-gray-500 mt-1 ml-6">{bookmark.chapter}</p>
              )}
              <p className="text-xs text-gray-400 mt-1 ml-6">{formatDate(bookmark.createdAt)}</p>
            </button>
            <button
              onClick={() => handleDelete(bookmark.cfi)}
              className="p-1 text-gray-400 hover:text-red-500 ml-2"
              aria-label="Delete bookmark"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookmarksList;