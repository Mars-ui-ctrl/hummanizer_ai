import './TextEditor.css';

function TextEditor({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
  disabled = false,
}) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="text-editor">
      <div className="text-editor-header">
        <span className="text-editor-label">
          <span className="text-editor-label-dot" />
          {label}
        </span>
        <div className="text-editor-stats">
          <span>{wordCount.toLocaleString()} words</span>
          <span>{charCount.toLocaleString()} chars</span>
        </div>
      </div>
      <textarea
        className={`text-editor-area ${readOnly ? 'readonly' : ''}`}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        spellCheck={false}
      />
      {!readOnly && value.length > 0 && (
        <button
          className="text-editor-clear"
          onClick={() => onChange?.('')}
          type="button"
        >
          Clear text
        </button>
      )}
    </div>
  );
}

export default TextEditor;
