import commentService from '../services/CommentService';
import BaseStore from './BaseStore';

class CommentStore extends BaseStore {
  constructor() {
    super([]);
    this.sendStateOnSubscribe = false;
    this.loaded = {};
  }
  async load(thumbnailId) {
    return this.ready.then(() => {
      if (this.loaded[thumbnailId]) {
        return this.clone(this.state.filter(c => c.thumbnailId === thumbnailId));
      }
      
      return commentService.get(thumbnailId).then(data => {
        if (data && data.success) {
          const comments = this.state.map(c => {
            const comment = data.results.find(rc => rc.id === c.id);
            if (comment) {
              return Object.assign({}, c, comment);
            }
            return c;
          });
          data.results.map(c => {
            const comment = comments.find(rc => rc.id === c.id);
            if (!comment) {
              comments.push(c);
            }
            return null;
          });
          this.setState(comments);
          return true;
        }
        return false;//failed to load
      });
    });
  }
  addEntry(comment) {
    const comments = this.state;
    comments.push(Object.assign({}, comment));
    this.setState(comments);
  }
  updateEntry(comment) {
    const comments = this.state.map(c => {
      if (c.id === comment.id) {
        return Object.assign({}, c, comment);
      }
      return c;
    });
    this.setState(comments);
  }
  removeEntry(id) {
    if (!id) {
      return;
    }
    const comments = this.state.filter(c => c.id !== id);
    this.setState(comments);
    commentService.remove(id);
  }
}

const commentStore = new CommentStore();
export default commentStore;