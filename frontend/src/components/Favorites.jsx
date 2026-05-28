import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavorites, removeFavorite, saveComment, clearAllFavorites } from '../store/favoritesSlice';
import { useNavigate } from 'react-router-dom';

const Favorites = () => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(state => state.favorites.items);
  const status = useAppSelector(state => state.favorites.status);
  const token = useAppSelector(state => state.user.token);
  const navigate = useNavigate();
  // generated-by-copilot: track pending comment edits keyed by bookId
  const [editingComment, setEditingComment] = useState({});
  // generated-by-copilot: state for the Clear All confirmation dialog
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearError, setClearError] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate]);

  const handleRemoveFavorite = async (bookId) => {
    if (!token) {
      navigate('/');
      return;
    }
    await dispatch(removeFavorite({ token, bookId }));
    dispatch(fetchFavorites(token));
  };

  // generated-by-copilot: save the edited comment for a favorite book
  const handleSaveComment = async (bookId) => {
    const comment = editingComment[bookId] ?? '';
    await dispatch(saveComment({ token, bookId, comment }));
    setEditingComment(prev => { const next = { ...prev }; delete next[bookId]; return next; });
  };

  // generated-by-copilot: handle the confirmed Clear All Favorites action
  const handleConfirmClearAll = async () => {
    if (!token) {
      navigate('/');
      return;
    }
    setIsClearing(true);
    setClearError('');
    const result = await dispatch(clearAllFavorites({ token }));
    setIsClearing(false);
    if (clearAllFavorites.rejected.match(result)) {
      setClearError('Failed to clear favorites. Please try again.');
      return;
    }
    setShowClearConfirm(false);
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load favorites.</div>;

  return (
    <div style={{ color: '#1f2933' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ margin: 0 }}>My Favorite Books</h2>
        {favorites.length > 0 && (
          <button
            onClick={() => { setClearError(''); setShowClearConfirm(true); }}
            aria-label="Clear all favorites"
            style={{
              background: '#fff',
              color: '#b91c1c',
              border: '1px solid #b91c1c',
              borderRadius: '4px',
              padding: '0.45rem 0.9rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Clear All
          </button>
        )}
      </div>
      {favorites.length === 0 ? (
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '400px',
          margin: '2rem auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          textAlign: 'center',
          color: '#888',
        }}>
          <p>No favorite books yet.</p>
          <p>
            Go to the <a href="/books" onClick={e => { e.preventDefault(); navigate('/books'); }}>book list</a> to add some!
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, maxWidth: '700px', margin: '1rem auto' }}>
          {favorites.map(book => {
            const isEditing = Object.prototype.hasOwnProperty.call(editingComment, book.id);
            const commentValue = isEditing ? editingComment[book.id] : (book.comment || '');
            return (
              <li
                key={book.id}
                style={{
                  padding: '0.9rem 1rem',
                  margin: '0.5rem 0',
                  borderRadius: '6px',
                  background: '#f4f7fb',
                  border: '1px solid #d7e1ea',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <strong>{book.title}</strong> by {book.author}
                  </span>
                  <button
                    onClick={() => handleRemoveFavorite(book.id)}
                    aria-label={`Remove ${book.title} from favorites`}
                    style={{
                      background: '#e25555',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.4rem 0.9rem',
                      cursor: 'pointer',
                      marginLeft: '1rem',
                    }}
                  >
                    Remove
                  </button>
                </div>
                {/* generated-by-copilot: inline comment section for each favorite */}
                <div style={{ marginTop: '0.5rem' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <textarea
                        value={commentValue}
                        onChange={e => setEditingComment(prev => ({ ...prev, [book.id]: e.target.value }))}
                        placeholder="Add a comment..."
                        aria-label={`Comment for ${book.title}`}
                        rows={3}
                        style={{
                          flex: 1,
                          minHeight: '90px',
                          padding: '0.7rem 0.85rem',
                          borderRadius: '4px',
                          border: '1px solid #9cb3c7',
                          background: '#fff',
                          color: '#111827',
                          fontSize: '1rem',
                          lineHeight: 1.4,
                          resize: 'vertical',
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        <button
                          onClick={() => handleSaveComment(book.id)}
                          style={{ background: '#2f6fb0', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.45rem 0.9rem', cursor: 'pointer', minWidth: '82px' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingComment(prev => { const next = { ...prev }; delete next[book.id]; return next; })}
                          style={{ background: '#fff', color: '#1f2933', border: '1px solid #9aa6b2', borderRadius: '4px', padding: '0.45rem 0.9rem', cursor: 'pointer', minWidth: '82px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: '#555', fontSize: '0.9rem', fontStyle: book.comment ? 'normal' : 'italic' }}>
                        {book.comment || 'No comment yet.'}
                      </span>
                      <button
                        onClick={() => setEditingComment(prev => ({ ...prev, [book.id]: book.comment || '' }))}
                        aria-label={`Edit comment for ${book.title}`}
                        style={{ background: '#fff', color: '#1f2933', border: '1px solid #9aa6b2', borderRadius: '4px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        {book.comment ? 'Edit' : 'Add comment'}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {/* generated-by-copilot: confirmation dialog for Clear All Favorites */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-all-title"
          aria-describedby="clear-all-desc"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => { if (!isClearing) setShowClearConfirm(false); }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '1.5rem',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <h3 id="clear-all-title" style={{ marginTop: 0 }}>Clear all favorites?</h3>
            <p id="clear-all-desc" style={{ color: '#374151' }}>
              This will remove all {favorites.length} favorite book{favorites.length === 1 ? '' : 's'} and their comments. This action cannot be undone.
            </p>
            {clearError && (
              <p role="alert" style={{ color: '#b91c1c', marginTop: '0.5rem' }}>{clearError}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                style={{
                  background: '#fff',
                  color: '#1f2933',
                  border: '1px solid #9aa6b2',
                  borderRadius: '4px',
                  padding: '0.5rem 1rem',
                  cursor: isClearing ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearAll}
                disabled={isClearing}
                aria-label="Confirm clear all favorites"
                style={{
                  background: '#b91c1c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.5rem 1rem',
                  cursor: isClearing ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {isClearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;
