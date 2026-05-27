import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavorites, removeFavorite, saveComment } from '../store/favoritesSlice';
import { useNavigate } from 'react-router-dom';

const Favorites = () => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(state => state.favorites.items);
  const status = useAppSelector(state => state.favorites.status);
  const token = useAppSelector(state => state.user.token);
  const navigate = useNavigate();
  // generated-by-copilot: track pending comment edits keyed by bookId
  const [editingComment, setEditingComment] = useState({});

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

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load favorites.</div>;

  return (
    <div style={{ color: '#1f2933' }}>
      <h2>My Favorite Books</h2>
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
    </div>
  );
};

export default Favorites;
