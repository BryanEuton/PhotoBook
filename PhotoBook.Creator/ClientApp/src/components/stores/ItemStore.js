import BaseStore from './BaseStore';

export default class ItemStore extends BaseStore {
  subscribe(item, listener) {
    const listenObj = { id: item.id, v: item.v, fn: listener };
    let subscribed = true;
    this.listeners.push(listenObj);
    const removeListener = () => {
      subscribed = false;
      this.listeners = this.listeners.filter((l) => listenObj !== l);
    };
    if (typeof this.state[item.id] !== 'undefined' && this.state[item.id]) {
      if (item.v < this.state[item.id].v) {
        listener(this.clone(this.state[item.id]));
      }
    } else {
      this.find(item.id, item).then(updated => {
        if (subscribed && listenObj.v < updated.v) {
          listenObj.v = updated.v;
          listener(updated);
        }
      });
    }
    return removeListener;
  }
  broadcast(to) {
    let affected = typeof to === 'undefined' || to === null ? this.listeners :
      this.listeners
        .filter(l => to.indexOf(l.id) !== -1 && l.v < this.state[l.id].v);

    affected
      .map(l => {
        let item = this.state[l.id];
        l.v = item.v;
        l.fn(this.clone(item));
        return null;
      });
  }
  update(updated) {
    let items = this.state,
      affected = [];
    if (Array.isArray(updated)) {
      updated.map(update => {
        items[update.id] = Object.assign({ v: 0 }, items[update.id], update);
        items[update.id].v++;
        affected.push(update.id);
        return null;
      });
    } else if (typeof updated !== 'undefined' && updated !== null && updated.id) {
      items[updated.id] = Object.assign({ v: 0 }, items[updated.id], updated);
      items[updated.id].v++;
      affected.push(updated.id);
    }
    this.setState(items, affected);
  }
  setState(state, changedIds) {
    this.state = state;
    this.broadcast(changedIds);
  }
  default(id) {
    return { id, v: 0 };
  }
}
