import { useState, useRef, useCallback } from 'react';
import { uploadPdf } from '../../services/api';
import './FileUpload.css';

function FileUpload({ onTextExtracted, onError, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  const handleUpload = useCallback(
    async (file) => {
      if (!file) return;

      if (file.type !== 'application/pdf') {
        onError?.('Only PDF files are accepted.');
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        onError?.('File size must be under 20MB.');
        return;
      }

      setIsUploading(true);
      setFileInfo(null);

      try {
        const result = await uploadPdf(file);

        setFileInfo({
          name: file.name,
          pages: result.pages,
          size: (file.size / 1024).toFixed(1),
        });
        onTextExtracted?.(result.text);
      } catch (err) {
        onError?.(err.message || 'Failed to process the PDF file.');
        setFileInfo(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onTextExtracted, onError]
  );

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const clearFile = () => {
    setFileInfo(null);
  };

  return (
    <div className="file-upload">
      <div
        className={`file-upload-zone ${isDragging ? 'dragging' : ''}`}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="file-upload-content">
          <div className="file-upload-icon">📄</div>
          <div className="file-upload-text">
            <strong>Click to upload</strong> or drag and drop
            <br />
            <span className="file-upload-text-hint">
              PDF files up to 20MB
            </span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="file-upload-input"
          disabled={disabled || isUploading}
        />
      </div>

      {isUploading && (
        <div className="file-upload-loading">
          <div className="file-upload-spinner" />
          <span className="file-upload-loading-text">
            Extracting text from PDF...
          </span>
        </div>
      )}

      {fileInfo && !isUploading && (
        <div className="file-upload-info">
          <span className="file-upload-info-icon">✅</span>
          <div className="file-upload-info-details">
            <span className="file-upload-info-name">{fileInfo.name}</span>
            <span className="file-upload-info-meta">
              {fileInfo.pages} page{fileInfo.pages !== 1 ? 's' : ''} •{' '}
              {fileInfo.size} KB
            </span>
          </div>
          <button
            className="file-upload-info-remove"
            onClick={(e) => {
              e.stopPropagation();
              clearFile();
            }}
            type="button"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
