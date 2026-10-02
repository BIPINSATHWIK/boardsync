import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import KanbanCard from './KanbanCard';
import AddItemForm from './AddItemForm';
import useBoardStore from '../store/boardStore';
import { toast } from './Toast';

export default function KanbanList({ list, cards, conflictCardId }) {
  const [addingCard, setAddingCard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const createCard = useBoardStore((s) => s.createCard);
  const deleteList = useBoardStore((s) => s.deleteList);

  const handleAddCard = async (title, url) => {
    const card = await createCard(list._id, title, '', url);
    if (card) {
      setAddingCard(false);
      toast.success('Card added');
    }
  };

  const handleDeleteList = async () => {
    await deleteList(list._id);
    toast.info(`List "${list.title}" deleted`);
  };

  return (
    <div className="kanban-list" id={`list-${list._id}`}>
      {/* Header */}
      <div className="kanban-list-header">
        <div className="kanban-list-title">
          <span>{list.title}</span>
          <span className="kanban-list-count">{cards.length}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {!confirmDelete ? (
            <button
              className="btn btn-ghost btn-icon"
              title="Delete list"
              onClick={() => setConfirmDelete(true)}
              id={`delete-list-${list._id}`}
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          ) : (
            <>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDeleteList}
                id={`confirm-delete-list-${list._id}`}
              >
                Delete
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cards drop zone */}
      <Droppable droppableId={list._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`kanban-cards${snapshot.isDraggingOver ? ' kanban-cards-dragging-over' : ''}`}
          >
            {cards.map((card, index) => (
              <KanbanCard
                key={card._id}
                card={card}
                index={index}
                conflictCardId={conflictCardId}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Footer — add card */}
      <div className="kanban-list-footer">
        {addingCard ? (
          <AddItemForm
            placeholder="Card title…"
            multiline
            onSubmit={handleAddCard}
            onCancel={() => setAddingCard(false)}
            submitLabel="Add card"
          />
        ) : (
          <button
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', gap: '0.4rem', fontSize: '0.8rem' }}
            onClick={() => setAddingCard(true)}
            id={`add-card-btn-${list._id}`}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> Add a card
          </button>
        )}
      </div>
    </div>
  );
}
