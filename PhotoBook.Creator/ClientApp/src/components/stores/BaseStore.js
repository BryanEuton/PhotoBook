export default class BaseStore {
  constructor(state) {    
    this.listeners = [];
    this.initialized = false;
    this.state = state;
    this.cloneState = true;
    this.isReady = false;
    this.sendStateOnSubscribe = true;
    this.ready = new Promise((resolve, reject) => { this.resolveReady = resolve; this.rejectReady = reject;});
  }

  subscribe(listener) {
    this.listeners.push(listener);
    const removeListener = () => {
      this.listeners = this.listeners.filter((l) => listener !== l);
    };
    if (this.isReady) {
      this.sendStateOnSubscribe && listener(this.getState());
    } else if (!this.initialized) {
      this.initialize().then(() => {
        var copy = this.cloneState ? this.clone(this.state) : this.state;
        this.isReady = true;
        this.resolveReady(copy);
        this.sendStateOnSubscribe && listener(copy);
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
    return JSON.parse(JSON.stringify(sheep));
  }
  setState(state) {
    this.state = state;
    var copy = this.getState();
    this.listeners.map(l => l(copy));
  }
}