import photoBookService from '../services/PhotoBookService';
import BaseStore from './BaseStore';

class PhotoBookStore extends BaseStore {
  constructor() {
    super([]);
  }
  async initialize() {
    if (super.initialize()) {
      return this.refresh();
    }
  }
  async find(id) {
    return this.ready.then(() => {
      var photoBook = this.state.find(p => p.id === id);
      return (photoBook && photoBook.photos ? photoBook : null) || photoBookService.get(id).then(pb => {
        if (pb) {
          let updated = pb;
          const photoBooks = this.state.map(p => {
            if (p.id === pb.id) {
              updated = Object.assign({}, p, pb);
              return updated;
            }
            return p;
          });
          this.setState(photoBooks);
          return updated;
        }
        return null;
      });
    });
  }
  async refresh() {
    console.log("PhotoBookStore fetching data");
    return photoBookService.get().then(photoBooks => {
      this.setState(photoBooks.map(pb => {
        const photoBook = this.state.find(p => p.id === pb.id);
        if (photoBook) {
          pb.photos = photoBook.photos;
        }
        return pb;
      }));
    });
  }
  removeEntry(id) {
    console.log("removing photoBook");
    const photoBook = this.state.find(t => t.id === id);
    if (photoBook === null) {
      return;
    }
    photoBookService.remove(id).then(success => {
      if (success) {
        const photoBooks = this.state.filter(t => t.id !== id);
        this.setState(photoBooks);
      }
    });
  }
}

const photoBookStore = new PhotoBookStore();
export default photoBookStore;