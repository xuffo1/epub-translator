import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Plus } from 'lucide-react';

interface FileUploaderProps {
  onFileLoaded: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoaded }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        console.log("File accepted:", file.name, file.size, file.type);
        onFileLoaded(file);
      }
    },
    [onFileLoaded]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/epub+zip': ['.epub'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB max size
    noClick: false,
    noKeyboard: false,
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <button
        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
      >
        <Plus className="w-5 h-5" />
        Add Book
      </button>
      <p className="mt-2 text-xs text-gray-500">Only .epub files are supported (max 100MB)</p>
    </div>
  );
};

export default FileUploader;