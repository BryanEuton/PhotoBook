export default class BaseStore {
  constructor(state) {    
    this.listeners = [];
    this.initialized = false;
    this.state = state;
    this.cloneState = true;
    this.isReady = false;
    this.sendStateOnSubscribe = true;
    this.v = 0;
    this.ready = new Promise((resolve, reject) => { this.resolveReady = resolve; this.rejectReady = reject;});
  }

  subscribe(version, listener) {
    if (typeof version === "function") {
      listener = version;
      version = 0;
    }
    const listenObj = { v: version, fn: listener };
    let subscribed = true;
    this.listeners.push(listenObj);
    const removeListener = () => {
      subscribed = false;
      this.listeners = this.listeners.filter((l) => listenObj !== l);
    };
    if (this.isReady) {
      if (this.sendStateOnSubscribe && listenObj.v < this.v && subscribed) {
        listenObj.v = this.v;
        listenObj.fn(this.getState(), this.v);
      }
    } else if (!this.initialized) {
      this.initialize().then(() => {
        var copy = this.cloneState ? this.clone(this.state) : this.state;
        this.isReady = true;
        this.resolveReady(copy);
        if (this.sendStateOnSubscribe && listenObj.v < this.v && subscribed) {
          listenObj.v = this.v;
          listenObj.fn(this.getState(), this.v);
        }
      });
    }
    return removeListener;
  }
  async initialize() {
    if (this.initialized) {
      return false;
    }
    this.initialized = true;
    return true;
  }
  getState() {
    return this.cloneState ? this.clone(this.state) : this.state;
  }
  clone(sheep) {
    return sheep !== 'undefined' && sheep !== null ? JSON.parse(JSON.stringify(sheep)) : null;
  }
  setState(state) {
    this.v++;
    this.state = state;
    if (this.isReady) {
      this.broadcast();
    }
  }
  broadcast() {
    var copy = this.getState();
    var affected = this.listeners.filter(l => l.v < this.v);
    copy.v = this.v;
    affected.map(l => {
      l.v = this.v;
      l.fn(copy, this.v);
      return null;
    });
  }
}