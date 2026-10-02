import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import useBoardStore from '../store/boardStore';
import { toast } from './Toast';
import LinkPreview from './LinkPreview';

// Detect if a string is a valid URL
const isUrl = (str) => {
  try {
    const u = new URL(str.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

// Extract first URL found in text
const extractUrl = (text) => {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
};

export default function KanbanCard({ card, index, conflictCardId }) {
  const deleteCard = useBoardStore((s) => s.deleteCard);
  const updateCard = useBoardStore((s) => s.updateCard);
  const isConflict = conflictCardId === card._id;
  const [showDetail, setShowDetail] = useState(false);
  const [cachedPreview, setCachedPreview] = useState(card.linkPreview || null);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete card "${card.title}"?`)) return;
    await deleteCard(card._id);
    toast.info('Card deleted');
  };

  // Determine the URL to preview — explicit url field OR auto-detected from title
  const previewUrl = card.url || extractUrl(card.title) || extractUrl(card.description);

  const handlePreviewFetched = async (preview) => {
    setCachedPreview(preview);
    // Only persist to server if the card doesn't already have a cached preview
    // (avoids redundant version increments and socket re-broadcasts)
    if (card.linkPreview) return;
    await updateCard(card._id, {
      version: card.version,
      linkPreview: preview,
      // Auto-set url field if none was explicitly set but we detected one
      ...(previewUrl && !card.url ? { url: previewUrl } : {}),
    });
  };

  return (
    <>
      <Draggable draggableId={card._id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`kanban-card${snapshot.isDragging ? ' is-dragging' : ''}${isConflict ? ' conflict' : ''}`}
            style={provided.draggableProps.style}
            id={`card-${card._id}`}
            onClick={() => setShowDetail(true)}
          >
            {/* Link preview thumbnail (shown above title if URL present) */}
            {previewUrl && (
              <LinkPreview
                url={previewUrl}
                cachedPreview={cachedPreview}
                onPreviewFetched={handlePreviewFetched}
              />
            )}

            <p className="kanban-card-title">{card.title}</p>
            {card.description && !previewUrl && (
              <p className="kanban-card-desc">{card.description}</p>
            )}
            {isConflict && (
              <p style={{ fontSize: '0.72rem', color: 'var(--warning)', marginTop: '0.35rem' }}>
                ⚠ Rolled back — modified by someone else
              </p>
            )}
            <div className="kanban-card-actions">
              <button
                className="btn btn-icon btn-danger"
                onClick={handleDelete}
                title="Delete card"
                id={`delete-card-${card._id}`}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.4rem' }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </Draggable>

      {/* Card detail modal */}
      {showDetail && (
        <CardDetailModal
          card={card}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}

// ── Card detail modal ──────────────────────────────────────────────────────────
function CardDetailModal({ card, onClose }) {
  const updateCard = useBoardStore((s) => s.updateCard);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [url, setUrl] = useState(card.url || '');
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) return;

    // Validate URL if provided
    if (url && !isUrl(url)) {
      setUrlError('Enter a valid URL starting with http:// or https://');
      return;
    }
    setUrlError('');

    setSaving(true);
    const result = await updateCard(card._id, {
      version: card.version,
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      // Clear cached preview if URL changed
      ...(url.trim() !== (card.url || '') ? { linkPreview: undefined } : {}),
    });
    setSaving(false);
    if (result.ok) {
      toast.success('Card updated');
      onClose();
    } else {
      toast.error(result.message || 'Failed to save');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} id={`card-modal-${card._id}`}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">✏ Edit Card</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="modal-close">✕</button>
        </div>

        <div className="modal-body">
          <div className="input-group">
            <label className="input-label">Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title"
              id="card-modal-title"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description…"
              rows={3}
              style={{ resize: 'vertical' }}
              id="card-modal-desc"
            />
          </div>

          <div className="input-group">
            <label className="input-label">🔗 Attachment URL</label>
            <input
              className={`input${urlError ? ' input-error' : ''}`}
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(''); }}
              placeholder="https://youtube.com/watch?v=... or any link"
              id="card-modal-url"
            />
            {urlError && <p className="field-hint">{urlError}</p>}
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Paste a YouTube, GitHub, or any web link to show a preview on the card.
            </p>
          </div>

          {url && !urlError && isUrl(url) && (
            <div style={{ marginTop: '0.5rem' }}>
              <LinkPreview url={url} />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            id="card-modal-save"
          >
            {saving ? <><span className="spinner" /> Saving…</> : 'Save changes'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
