import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useBoardStore from '../store/boardStore';
import useAuthStore from '../store/authStore';
import { disconnectSocket } from '../store/socketStore';
import { toast } from '../components/Toast';

export default function BoardListPage() {
  const navigate = useNavigate();
  const { boards, isLoadingBoards, fetchBoards, createBoard, deleteBoard } = useBoardStore();
  const { user, logout } = useAuthStore();
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchBoards(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setCreating(true);
    const board = await createBoard(trimmed);
    setCreating(false);
    if (board) {
      setNewTitle('');
      toast.success(`Board "${board.title}" created`);
    }
  };

  const handleDelete = async (e, boardId, title) => {
    e.stopPropagation();
    if (!confirm(`Delete board "${title}" and all its lists and cards?`)) return;
    await deleteBoard(boardId);
    toast.info('Board deleted');
  };

  const handleLogout = async () => {
    await logout();
    disconnectSocket();
    navigate('/login');
  };

  const initials = (email) => email?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      {/* Navbar */}
      <nav className="navbar" id="main-navbar">
        <div className="navbar-logo">
          Board<span>Sync</span>
        </div>
        <div className="navbar-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, color: '#fff',
            }}>
              {initials(user?.email)}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {user?.email}
            </span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
            id="logout-btn"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="page" id="boards-page">
        {/* Header + create form */}
        <div className="page-header">
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>My Boards</h1>
            <p style={{ fontSize: '0.875rem' }}>
              {boards.length} board{boards.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Create board form */}
        <form className="create-board-form" onSubmit={handleCreate} id="create-board-form">
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label" htmlFor="new-board-title">New board</label>
            <input
              id="new-board-title"
              className="input"
              placeholder="Board name…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={creating || !newTitle.trim()}
            id="create-board-submit"
          >
            {creating ? <span className="spinner" /> : '+ Create'}
          </button>
        </form>

        <div className="divider" />

        {/* Board grid */}
        {isLoadingBoards ? (
          <div className="page-loader">
            <span className="spinner" style={{ width: '1.5rem', height: '1.5rem' }} />
            Loading boards…
          </div>
        ) : boards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No boards yet</h3>
            <p>Create your first board above to get started.</p>
          </div>
        ) : (
          <div className="boards-grid" id="boards-grid">
            {boards.map((board) => (
              <div
                key={board._id}
                className="board-card"
                onClick={() => navigate(`/boards/${board._id}`)}
                id={`board-card-${board._id}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/boards/${board._id}`)}
              >
                <h3 className="board-card-title">{board.title}</h3>
                <div className="board-card-meta">
                  <span>👥</span>
                  <span>{board.members?.length ?? 1} member{(board.members?.length ?? 1) !== 1 ? 's' : ''}</span>
                </div>
                <div className="board-card-actions">
                  <button
                    className="btn btn-danger btn-icon"
                    onClick={(e) => handleDelete(e, board._id, board.title)}
                    title="Delete board"
                    id={`delete-board-${board._id}`}
                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
