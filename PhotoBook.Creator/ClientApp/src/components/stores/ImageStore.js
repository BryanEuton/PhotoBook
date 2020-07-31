import photoService from '../services/PhotoService';
import ItemStore from './ItemStore';

class ImageStore extends ItemStore {
  constructor() {
    super({});
  }
  async find(id) {
    var image = this.state[id];
    return (typeof image !== 'undefined' ? image : null) || photoService.get(id).then(dto => {
      if (dto) {
        let updated = Object.assign({ v: 0 }, this.state[dto.id], dto),
          images = this.state;
        updated.v++;
        images[dto.id] = updated;

        this.setState(images, [id]);
        return updated;
      }
      return null;
    });
  }
  faceAdded(id, faceId) {
    if (this.state[id] && this.state[id].faces.filter(id => id === faceId).length === 0) {
      console.log("face added to image: " + id);
      this.state[id].faces.push(faceId);
      this.state[id].v++;
      this.broadcast([id]);
    }
  }
  faceRemoved(id, faceId) {
    if (this.state[id] && this.state[id].faces.filter(id => id === faceId).length === 1) {
      console.log("face removed from image: " + id);
      this.state[id].faces = this.state[id].faces.filter(id => id !== faceId);
      this.state[id].v++;
      this.broadcast([id]);
    }
  }
  default(id) {
    return {
      id,
      comments: [],
      faces: [],
      tags: [],
      photoBooks: [],
      v: 0
    };
  }
}

const imageStore = new ImageStore();
export default imageStore;