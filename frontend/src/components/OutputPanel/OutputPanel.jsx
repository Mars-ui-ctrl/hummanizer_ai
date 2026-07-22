import { useState, useCallback } from 'react';
import { downloadFile } from '../../services/api';
import './OutputPanel.css';

function OutputPanel({ text, onToast }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onToast?.('Text copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast?.('Failed to copy text.', 'error');
    }
  }, [text, onToast]);

  const handleDownload = useCallback(
    async (format) => {
      try {
        setDownloading(format);
        await downloadFile(text, format);
        onToast?.(`Downloaded as ${format.toUpperCase()}`, 'success');
      } catch (err) {
        onToast?.(err.message || `Failed to download as ${format}.`, 'error');
      } finally {
        setDownloading(null);
      }
    },
    [text, onToast]
  );

  if (!text) {
    return (
      <div className="output-panel">
        <div className="output-panel-header">
          <span className="output-panel-label">
            <span className="output-panel-label-dot" style={{ background: 'var(--text-tertiary)' }} />
            Output
          </span>
        </div>
        <div className="output-panel-empty">
          <span className="output-panel-empty-icon">✍️</span>
          <span className="output-panel-empty-text">
            Rewritten text will appear here
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="output-panel">
      <div className="output-panel-header">
        <span className="output-panel-label">
          <span className="output-panel-label-dot" />
          Output
          <span className="output-panel-stats">
            <span>{wordCount.toLocaleString()} words</span>
            <span>{charCount.toLocaleString()} chars</span>
          </span>
        </span>
        <div className="output-panel-actions">
          <button
            className={`output-panel-btn output-panel-btn--copy ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            type="button"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
          <button
            className="output-panel-btn"
            onClick={() => handleDownload('pdf')}
            disabled={downloading === 'pdf'}
            type="button"
          >
            {downloading === 'pdf' ? '...' : '📕 PDF'}
          </button>
          <button
            className="output-panel-btn"
            onClick={() => handleDownload('docx')}
            disabled={downloading === 'docx'}
            type="button"
          >
            {downloading === 'docx' ? '...' : '📘 DOCX'}
          </button>
          <button
            className="output-panel-btn"
            onClick={() => handleDownload('txt')}
            disabled={downloading === 'txt'}
            type="button"
          >
            {downloading === 'txt' ? '...' : '📄 TXT'}
          </button>
        </div>
      </div>
      <textarea
        className="output-panel-textarea"
        value={text}
        readOnly
        spellCheck={false}
      />
    </div>
  );
}

export default OutputPanel;
