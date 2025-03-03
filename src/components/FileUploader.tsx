import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

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

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/epub+zip': ['.epub'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB max size
  });

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
        isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50' : 
        isDragReject ? 'border-red-500 bg-red-50' : 
        'border-gray-300 hover:bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className={`w-12 h-12 mb-4 ${isDragReject ? 'text-red-400' : 'text-gray-400'}`} />
      <p className="mb-2 text-lg font-medium text-gray-700">
        {isDragActive && !isDragReject ? 'Drop the EPUB file here' : 
         isDragReject ? 'This file type is not supported' :
         'Drag & drop an EPUB file here'}
      </p>
      <p className="text-sm text-gray-500">or click to select a file</p>
      <p className="mt-2 text-xs text-gray-400">Only .epub files are supported (max 100MB)</p>
    </div>
  );
};

export default FileUploader;