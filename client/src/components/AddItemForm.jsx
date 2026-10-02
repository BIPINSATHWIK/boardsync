import { useState, useRef, useEffect } from 'react';
import LinkPreview from './LinkPreview';

// Detect if a string is a valid http/https URL
const detectUrl = (text) => {
  try {
    const u = new URL(text.trim());
    return u.protocol === 'http:' || u.protocol === 'https:' ? text.trim() : null;
  } catch {
    return null;
  }
};

/**
 * Inline form for adding a card or a list.
 * Props:
 *   placeholder  – string
 *   multiline    – bool (textarea vs input)
 *   onSubmit(value, detectedUrl?) – async fn; detectedUrl is set when the value IS a URL
 *   onCancel()
 *   submitLabel  – string (default "Add")
 */
export default function AddItemForm({
  placeholder = 'Enter title…',
  multiline = false,
  onSubmit,
  onCancel,
  submitLabel = 'Add',
}) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const formRef = useRef(null);
  // Guard against double-submit; never reset until the async call finishes
  const submittingRef = useRef(false);

  // Auto-detect URL in value (only for multiline card textarea)
  const detectedUrl = multiline ? detectUrl(value) : null;

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    // Block any re-entry while a submission is in flight
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    // Pass detected URL as second arg so the parent can store it as card.url
    await onSubmit(trimmed, detectedUrl || undefined);
    submittingRef.current = false;
    setLoading(false);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onCancel(); return; }

    // Single-line: Enter → submit via native requestSubmit (goes through the form
    // pipeline, so it is properly blocked by the disabled state and submittingRef)
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      if (!submittingRef.current) formRef.current?.requestSubmit();
      return;
    }

    // Multiline: Ctrl/Cmd+Enter → submit
    if (multiline && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!submittingRef.current) formRef.current?.requestSubmit();
    }
  };

  return (
    <form ref={formRef} className="add-item-form" onSubmit={handleSubmit}>
      {multiline ? (
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          id="add-item-textarea"
        />
      ) : (
        <input
          ref={inputRef}
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          id="add-item-input"
        />
      )}

      {/* Inline URL preview — shown when a YouTube/web URL is pasted into the card textarea */}
      {detectedUrl && (
        <div className="add-item-link-preview">
          <p className="add-item-link-label">🔗 Link preview</p>
          <LinkPreview url={detectedUrl} />
        </div>
      )}

      <div className="add-item-actions">
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={loading || !value.trim()}
          id="add-item-submit"
        >
          {loading ? <span className="spinner" /> : submitLabel}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onCancel}
          id="add-item-cancel"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
