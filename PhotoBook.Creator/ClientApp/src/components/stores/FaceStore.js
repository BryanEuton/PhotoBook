import faceService from '../services/FaceService';
import ItemStore from './ItemStore';
import imageStore from './ImageStore';

class FaceStore extends ItemStore {
  constructor() {
    super({});
    this.fetching = [];//holds image ids + promises
    this.fetched = [];//holds image ids
  } 
  async find(id, item) {
    const face = this.state[id];
    if (typeof face !== 'undefined') {
      return face;
    }
    let fetched = this.fetching.find(f => f.id === item.imageId);
    if (fetched) {
      return fetched.promise.then(() => {
        return this.state[id];
      });
    }
    return faceService.get(id).then(dto => {
      if (dto) {
        let updated = Object.assign({ v: 0 }, this.state[dto.id], dto),
          faces = this.state;
        updated.v++;
        faces[dto.id] = updated;

        this.setState(faces, [id]);
        return updated;
      }
      return null;
    });
  }
  async prefetch(imageId) {
    if (this.fetching.filter(f => f.id === imageId).length || this.fetched.find(id => id === imageId)) {
      return;
    }
    let fetch = { id: imageId };
    this.fetching.push(fetch);
    fetch.promise = faceService.getFaces(imageId).then(faces => {
      this.fetching = this.fetching.filter(f => f.id !== imageId);
      this.fetched.push(imageId);
      if (faces) {
        this.update(faces);
      }
    });
  }
  update(updated) {
    var isNew = typeof this.state[updated.id] === 'undefined' || this.state[updated.id] === null,
      wasHidden = isNew ? false : this.state[updated.id].isHidden;
    super.update(updated);
    if (isNew || (wasHidden && this.state[updated.id] && !this.state[updated.id].isHidden)) {
      imageStore.faceAdded(updated.imageId, updated.id);
    }
    if (this.state[updated.id] && this.state[updated.id].isHidden) {
      imageStore.faceRemoved(updated.imageId, updated.id);
    }
  }
  default(id, imageId) {
    return {
      id,
      imageId,
      v: 0,
      x: 0,
      y: 0,
      width: 1,
      height: 1
    };
  }
}

const faceStore = new FaceStore();
export default faceStore;