import React, { useState, useEffect  } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Button } from 'reactstrap';
import { commentStore } from '../stores';
import { CommentModal, DeleteModal } from '../modals';
import { stopEvent } from '../../utils';

export const ListComments = props => {
  const [comments, setComments] = useState([]),
    [loading, setLoading] = useState(true),
    [editCommentId, setEditCommentId] = useState(0),
    [deleteCommentId, setDeleteCommentId] = useState(0),
    [numCommentsDisplayed, setNumCommentsDisplayed] = useState(5);
  useEffect(() => {
    let ignore = false;
    function handleStoreUpdate(state) {
      if (ignore) {
        return;
      }
      setComments(state.filter(c => c.thumbnailId === props.thumbnailId));
      setLoading(false);
    }

    const unsubscribe = commentStore.subscribe(handleStoreUpdate);
    commentStore.load(props.thumbnailId);

    return () => {
      ignore = true;
      unsubscribe();
    };
  }, [props.thumbnailId]);

  if (loading) {
    return (<p><em>Loading...</em></p>);
  }
  function handleCommentModalClosed(comment) {
    if (comment) {
      setEditCommentId(0);
    }
  }
  function handleDeleteModalClosed(confirmed) {
    if (confirmed) {
      commentStore.removeEntry(deleteCommentId);
      if (props.onCommentRemoved) {
        props.onCommentRemoved(deleteCommentId);
      }
    }
    setDeleteCommentId(0);
  }
  function handleShowMoreComments(e) {
    stopEvent(e);
    setNumCommentsDisplayed(numCommentsDisplayed + 5);
  }
  const displayedComments = comments.slice(0, numCommentsDisplayed);
  return (
    <div className="image-comments">
      <div className="row">
        {
          displayedComments.map(c =>
            <div key={c.id} className="col-sm-12 comment">
              <span>{c.text} {c.createdBy ? "- " + c.createdBy : null}</span>
              {c.canEdit ? <FontAwesomeIcon icon={faPencilAlt} onClick={e => setEditCommentId(c.id)} /> : null}
              {c.canDelete ? <FontAwesomeIcon icon={faTimes} onClick={e => setDeleteCommentId(c.id)} /> : null}
              {editCommentId !== c.id ? null : <CommentModal {...props} comment={c} onClose={handleCommentModalClosed} />}
              {deleteCommentId !== c.id ? null : <DeleteModal {...props} title="Are you sure you want to delete this comment?" body={c.text} onClose={handleDeleteModalClosed} />}
            </div>
          )
        }
      </div>
      {displayedComments.length < comments.length ? <Button onClick={e => handleShowMoreComments(e)}>More</Button> : null}
    </div>
  );
}