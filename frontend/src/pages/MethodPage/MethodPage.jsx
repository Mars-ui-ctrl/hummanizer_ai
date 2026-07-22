import { useState, useCallback } from 'react';
import TextEditor from '../../components/TextEditor/TextEditor';
import FileUpload from '../../components/FileUpload/FileUpload';
import OutputPanel from '../../components/OutputPanel/OutputPanel';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import { rewriteText } from '../../services/api';
import './MethodPage.css';

/**
 * MethodPage — Reusable page component for all rewrite methods.
 * The only difference between methods is the backend endpoint (passed via props).
 */
function MethodPage({ method, onToast }) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTextExtracted = useCallback(
    (text) => {
      setInputText(text);
      onToast?.('PDF text extracted successfully!', 'success');
    },
    [onToast]
  );

  const handleUploadError = useCallback(
    (message) => {
      onToast?.(message, 'error');
    },
    [onToast]
  );

  const handleRewrite = useCallback(async () => {
    if (!inputText.trim()) {
      onToast?.('Please enter or upload some text first.', 'warning');
      return;
    }

    setIsProcessing(true);
    setOutputText('');

    try {
      const result = await rewriteText(inputText, method.endpoint);
      setOutputText(result.result);
      onToast?.('Text rewritten successfully!', 'success');
    } catch (err) {
      onToast?.(err.message || 'Rewrite failed. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, method.endpoint, onToast]);

  return (
    <div className="method-page">
      {/* Header */}
      <div className="method-page-header">
        <div className="method-page-icon">{method.icon}</div>
        <h1 className="method-page-title">{method.name}</h1>
        <p className="method-page-subtitle">{method.description}</p>
      </div>

      <div className="method-page-divider" />

      {/* Upload */}
      <div className="method-page-section">
        <p className="method-page-section-label">Upload PDF</p>
        <FileUpload
          onTextExtracted={handleTextExtracted}
          onError={handleUploadError}
          disabled={isProcessing}
        />
      </div>

      {/* OR divider */}
      <div className="method-page-or">
        <div className="method-page-or-line" />
        <span className="method-page-or-text">or paste text</span>
        <div className="method-page-or-line" />
      </div>

      {/* Text Input */}
      <div className="method-page-section">
        <TextEditor
          label="Input Text"
          value={inputText}
          onChange={setInputText}
          placeholder="Paste your text here..."
          disabled={isProcessing}
        />
      </div>

      {/* Rewrite Button */}
      <div className="method-page-action">
        <button
          className="btn-primary method-page-rewrite-btn"
          onClick={handleRewrite}
          disabled={isProcessing || !inputText.trim()}
          type="button"
        >
          {isProcessing ? (
            <>
              <span className="btn-spinner" />
              <span>Processing...</span>
            </>
          ) : (
            <span>✦ Rewrite Text</span>
          )}
        </button>
      </div>

      {/* Loading or Output */}
      <div className="method-page-section">
        {isProcessing ? (
          <LoadingOverlay
            message="AI is rewriting your text..."
            subtitle={`Using ${method.subtitle} strategy`}
          />
        ) : (
          <OutputPanel text={outputText} onToast={onToast} />
        )}
      </div>
    </div>
  );
}

export default MethodPage;
