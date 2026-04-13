import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavorites, removeFavorite, updateFavoriteComment } from '../store/favoritesSlice';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Favorites.module.css';

const Favorites = () => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(state => state.favorites.items);
  const status = useAppSelector(state => state.favorites.status);
  const token = useAppSelector(state => state.user.token);
  const navigate = useNavigate();
  const [removeError, setRemoveError] = useState('');
  const [commentEditing, setCommentEditing] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentErrors, setCommentErrors] = useState({});

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate]);

  const handleRemove = (bookId) => {
    setRemoveError('');
    dispatch(removeFavorite({ token, bookId }))
      .unwrap()
      .catch(err => setRemoveError(err.message || 'Failed to remove favorite.'));
  };

  const handleEditComment = (book) => {
    setCommentDrafts(prev => ({ ...prev, [book.id]: book.comment || '' }));
    setCommentEditing(prev => ({ ...prev, [book.id]: true }));
  };

  const handleCancelComment = (bookId) => {
    setCommentEditing(prev => ({ ...prev, [bookId]: false }));
    setCommentDrafts(prev => { const n = { ...prev }; delete n[bookId]; return n; });
    setCommentErrors(prev => { const n = { ...prev }; delete n[bookId]; return n; });
  };

  const handleSaveComment = (bookId) => {
    setCommentErrors(prev => { const n = { ...prev }; delete n[bookId]; return n; });
    const comment = commentDrafts[bookId] ?? '';
    dispatch(updateFavoriteComment({ token, bookId, comment }))
      .unwrap()
      .then(() => {
        dispatch(fetchFavorites(token));
        setCommentEditing(prev => ({ ...prev, [bookId]: false }));
        setCommentDrafts(prev => { const n = { ...prev }; delete n[bookId]; return n; });
      })
      .catch(err => {
        setCommentErrors(prev => ({ ...prev, [bookId]: err.message || 'Failed to save comment.' }));
      });
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load favorites.</div>;

  return (
    <div>
      <h2>My Favorite Books</h2>
      {removeError && <div className={styles.errorBanner}>{removeError}</div>}
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
        <div className={styles.favGrid}>
          {favorites.map(book => (
            <div className={styles.favCard} key={book.id}>
              <div className={styles.favTitle}>{book.title}</div>
              <div className={styles.favAuthor}>by {book.author}</div>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(book.id)}
              >
                Remove
              </button>
              <div className={styles.commentSection}>
                <div className={styles.commentLabel}>Comment</div>
                {commentEditing[book.id] ? (
                  <>
                    <textarea
                      className={styles.commentTextarea}
                      rows={3}
                      value={commentDrafts[book.id] ?? ''}
                      onChange={e => setCommentDrafts(prev => ({ ...prev, [book.id]: e.target.value }))}
                      placeholder="Write a comment..."
                    />
                    {commentErrors[book.id] && (
                      <div style={{ color: '#b71c1c', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                        {commentErrors[book.id]}
                      </div>
                    )}
                    <div className={styles.commentActions}>
                      <button className={styles.saveBtn} onClick={() => handleSaveComment(book.id)}>Save</button>
                      <button className={styles.cancelBtn} onClick={() => handleCancelComment(book.id)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    {book.comment
                      ? <p className={styles.commentText}>{book.comment}</p>
                      : <span className={styles.noComment}>No comment yet</span>
                    }
                    <button className={styles.editBtn} onClick={() => handleEditComment(book)}>
                      {book.comment ? 'Edit' : 'Add Comment'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
