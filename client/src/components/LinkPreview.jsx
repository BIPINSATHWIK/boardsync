import { useState, useEffect, useRef } from 'react';
import { get } from '../api/client';

/**
 * Fetches and displays a link preview for a given URL.
 * Shows a Trello-style attachment card with thumbnail, title, site name and favicon.
 */
export default function LinkPreview({ url, cachedPreview, onPreviewFetched }) {
  const [preview, setPreview] = useState(cachedPreview || null);
  const [loading, setLoading] = useState(!cachedPreview && !!url);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!url || cachedPreview || fetchedRef.current) return;
    fetchedRef.current = true;

    const controller = new AbortController();
    setLoading(true);
    setError(false);

    get(`/link-preview?url=${encodeURIComponent(url)}`)
      .then((data) => {
        setPreview(data.preview);
        onPreviewFetched?.(data.preview);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url]);

  if (!url) return null;

  if (loading) {
    return (
      <div className="link-preview link-preview-loading">
        <span className="spinner" style={{ width: '0.9rem', height: '0.9rem' }} />
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Loading preview…</span>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <a
        className="link-preview link-preview-fallback"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="link-preview-icon">🔗</span>
        <span className="link-preview-url">{url}</span>
      </a>
    );
  }

  const isYouTube =
    url.includes('youtube.com') || url.includes('youtu.be');

  return (
    <a
      className={`link-preview${isYouTube ? ' link-preview-youtube' : ''}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      {preview.image && (
        <div className="link-preview-thumb">
          <img
            src={preview.image}
            alt={preview.title || 'Preview'}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {isYouTube && (
            <div className="link-preview-play">
              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>
      )}
      <div className="link-preview-body">
        {preview.siteName && (
          <div className="link-preview-site">
            {preview.favicon && (
              <img
                src={preview.favicon}
                alt=""
                width="12"
                height="12"
                className="link-preview-favicon"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <span>{preview.siteName}</span>
          </div>
        )}
        {preview.title && (
          <p className="link-preview-title">{preview.title}</p>
        )}
        {preview.description && (
          <p className="link-preview-desc">{preview.description}</p>
        )}
      </div>
    </a>
  );
}
