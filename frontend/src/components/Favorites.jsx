import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavorites, removeFavorite, saveComment, clearAllFavorites } from '../store/favoritesSlice';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Favorites.module.css';

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
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <h2 className={styles.pageTitle}>My Favorite Books</h2>
        <button
          onClick={() => { if (favorites.length > 0) { setClearError(''); setShowClearConfirm(true); } }}
          disabled={favorites.length === 0}
          aria-label="Clear all favorites"
          title={favorites.length === 0 ? 'No favorites to clear' : 'Clear all favorites'}
          className={styles.dangerButton}
        >
          Clear All
        </button>
      </div>
      {favorites.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No favorite books yet.</p>
          <p>
            Go to the <a className={styles.emptyLink} href="/books" onClick={e => { e.preventDefault(); navigate('/books'); }}>book list</a> to add some.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {favorites.map(book => {
            const isEditing = Object.prototype.hasOwnProperty.call(editingComment, book.id);
            const commentValue = isEditing ? editingComment[book.id] : (book.comment || '');
            return (
              <li
                key={book.id}
                className={styles.card}
              >
                <div className={styles.cardTop}>
                  <div className={styles.bookMeta}>
                    <p className={styles.bookLine}>
                      <span className={styles.bookTitle}>{book.title}</span>{' '}
                      <span className={styles.bookAuthor}>by {book.author}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFavorite(book.id)}
                    aria-label={`Remove ${book.title} from favorites`}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>
                <div className={styles.commentSection}>
                  {isEditing ? (
                    <div className={styles.commentEditor}>
                      <textarea
                        className={styles.commentTextarea}
                        value={commentValue}
                        onChange={e => setEditingComment(prev => ({ ...prev, [book.id]: e.target.value }))}
                        placeholder="Add a comment..."
                        aria-label={`Comment for ${book.title}`}
                        rows={3}
                      />
                      <div className={styles.editorActions}>
                        <button
                          onClick={() => handleSaveComment(book.id)}
                          className={styles.primaryButton}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingComment(prev => { const next = { ...prev }; delete next[book.id]; return next; })}
                          className={styles.secondaryButton}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.commentDisplay}>
                      <span className={`${styles.commentText} ${book.comment ? '' : styles.commentTextEmpty}`}>
                        {book.comment || 'No comment yet.'}
                      </span>
                      <button
                        onClick={() => setEditingComment(prev => ({ ...prev, [book.id]: book.comment || '' }))}
                        aria-label={`Edit comment for ${book.title}`}
                        className={styles.secondaryButton}
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
          className={styles.dialogOverlay}
          onClick={() => { if (!isClearing) setShowClearConfirm(false); }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className={styles.dialog}
          >
            <h3 id="clear-all-title" className={styles.dialogTitle}>Clear all favorites?</h3>
            <p id="clear-all-desc" className={styles.dialogText}>
              This will remove all {favorites.length} favorite book{favorites.length === 1 ? '' : 's'} and their comments. This action cannot be undone.
            </p>
            {clearError && (
              <p role="alert" className={styles.dialogError}>{clearError}</p>
            )}
            <div className={styles.dialogActions}>
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearAll}
                disabled={isClearing}
                aria-label="Confirm clear all favorites"
                className={styles.dangerButton}
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
