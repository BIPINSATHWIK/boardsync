import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import useBoardStore from '../store/boardStore';
import useAuthStore from '../store/authStore';
import { joinBoard, leaveBoard } from '../store/socketStore';
import KanbanList from '../components/KanbanList';
import AddItemForm from '../components/AddItemForm';
import { toast } from '../components/Toast';

export default function BoardDetailPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const {
    currentBoard, lists, cards, isLoadingBoard,
    fetchBoard, createList, moveCard, addMember,
    conflictCard, clearConflict, clearBoard,
  } = useBoardStore();
  const { user } = useAuthStore();

  const [addingList, setAddingList] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('editor');
  const [addingMember, setAddingMember] = useState(false);
  const membersRef = useRef(null);

  // Close members panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (membersRef.current && !membersRef.current.contains(e.target)) {
        setShowMembers(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    fetchBoard(boardId);
    joinBoard(boardId);
    return () => {
      leaveBoard();
      clearBoard();
    };
  }, [boardId]);

  // Show conflict toast when a card is rolled back
  useEffect(() => {
    if (conflictCard) {
      toast.warning(conflictCard.message, 5000);
      const timer = setTimeout(() => clearConflict(), 5500);
      return () => clearTimeout(timer);
    }
  }, [conflictCard]);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const card = cards.find((c) => c._id === draggableId);
    if (!card) return;

    await moveCard(
      draggableId,
      destination.droppableId,
      destination.index,
      card.version,
    );
  };

  const handleAddList = async (title) => {
    const list = await createList(boardId, title);
    if (list) {
      setAddingList(false);
      toast.success('List added');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setAddingMember(true);
    const result = await addMember(boardId, memberEmail.trim(), memberRole);
    setAddingMember(false);
    if (result.ok) {
      setMemberEmail('');
      toast.success('Member added');
    } else {
      toast.error(result.message);
    }
  };

  const myRole = currentBoard?.members?.find((m) => m.user === user?._id || m.user?._id === user?._id)?.role;
  const isOwner = myRole === 'owner';

  // Sort lists by order, cards by order within their list
  const sortedLists = [...lists].sort((a, b) => a.order - b.order);
  const cardsForList = (listId) =>
    cards.filter((c) => c.list === listId).sort((a, b) => a.order - b.order);

  const initials = (email) => email?.[0]?.toUpperCase() ?? '?';

  if (isLoadingBoard) {
    return (
      <div className="board-page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.5rem', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
          <Link to="/" className="board-topbar-back">← Boards</Link>
        </div>
        <div className="page-loader">
          <span className="spinner" style={{ width: '1.5rem', height: '1.5rem' }} />
          Loading board…
        </div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="board-page">
        <div className="page-loader" style={{ flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--danger)' }}>Board not found or access denied.</p>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>Back to boards</button>
        </div>
      </div>
    );
  }

  return (
    <div className="board-page" id="board-detail-page">
      {/* Top bar */}
      <div className="board-topbar">
        <Link to="/" className="board-topbar-back" id="back-to-boards">
          ← Boards
        </Link>
        <h2 className="board-topbar-title">{currentBoard.title}</h2>
        {myRole && (
          <span className={`badge badge-${myRole}`}>{myRole}</span>
        )}

        {/* Members panel */}
        <div className="members-btn-wrapper" ref={membersRef} style={{ marginLeft: 'auto' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowMembers((v) => !v)}
            id="members-btn"
          >
            👥 Members ({currentBoard.members?.length ?? 1})
          </button>

          {showMembers && (
            <div className="members-panel" id="members-panel">
              <h4 style={{ marginBottom: '0.75rem' }}>Board members</h4>
              <div className="members-list">
                {currentBoard.members?.map((m, i) => (
                  <div key={i} className="member-row">
                    <div className="member-avatar">{initials(m.email || m.user?.email || '?')}</div>
                    <span className="member-email">{m.email || m.user?.email || m.user}</span>
                    <span className={`badge badge-${m.role}`}>{m.role}</span>
                  </div>
                ))}
              </div>

              {isOwner && (
                <div className="add-member-form">
                  <h4>Add member</h4>
                  <form onSubmit={handleAddMember} id="add-member-form">
                    <div className="add-member-row">
                      <input
                        className="input"
                        type="email"
                        placeholder="email@example.com"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        id="add-member-email"
                      />
                      <select
                        className="role-select"
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        id="add-member-role"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={addingMember || !memberEmail.trim()}
                      id="add-member-submit"
                    >
                      {addingMember ? <span className="spinner" /> : 'Add'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Kanban area */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-scroll" id="kanban-board">
          {sortedLists.map((list) => (
            <KanbanList
              key={list._id}
              list={list}
              cards={cardsForList(list._id)}
              conflictCardId={conflictCard?.cardId}
            />
          ))}

          {/* Add list */}
          {addingList ? (
            <div className="add-list-form" id="add-list-form">
              <AddItemForm
                placeholder="List title…"
                onSubmit={handleAddList}
                onCancel={() => setAddingList(false)}
                submitLabel="Add list"
              />
            </div>
          ) : (
            <button
              className="add-list-btn"
              onClick={() => setAddingList(true)}
              id="add-list-btn"
            >
              <span style={{ fontSize: '1.1rem' }}>+</span> Add a list
            </button>
          )}
        </div>
      </DragDropContext>
    </div>
  );
}
