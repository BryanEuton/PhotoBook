import tagService from '../services/TagService';
import BaseStore from './BaseStore';

class TagStore extends BaseStore {
  constructor() {
    super({
      tags: [],
      types: []
    });
  }
  async initialize() {
    if (super.initialize()) {
      return this.refresh();
    }
  }
  async refresh() {
    console.log("TagStore fetching data");
    return tagService.get().then(tags => {
      if (!tags) {
        return;
      }
      const state = {
        tags: tags,
        types: []
      }
      tags.map(tag => {
        if (state.types.filter(t => t === tag.type).length === 0) {
          state.types.push(tag.type);
        }
        if (tag.type === "Person") {
          var bits = tag.name.split(' ');
          tag.lastName = bits.length > 1 ? bits[bits.length - 1] : '';
        }
        return null;
      });
      this.setState(state);
    });
  }
  removeEntry(id) {
    console.log("removing tag");
    const tag = this.state.tags.find(t => t.id === id);
    if (tag === null) {
      return;
    }
    tagService.remove(id).then(success => {
      if (success) {
        const state = this.state;
        state.tags = state.tags.filter(t => t.id !== id);
        if (!state.tags.find(t => t.type === tag.type)) {
          state.types = state.types.filter(t => t.id !== tag.type);
        }
        this.setState(state);
      }
    });
  }
  //override the super so that we return an copy of the store's state.
  /*
   getState() {
    const state = super.getState();
    return {
      tags: state.tags.map(tag => Object.assign({}, tag)),
      types: state.types.map(type => type)
    };
  }*/
}

const tagStore = new TagStore();
export default tagStore;