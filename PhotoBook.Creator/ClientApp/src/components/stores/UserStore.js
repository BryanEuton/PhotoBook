import userService from '../services/UserService';
import BaseStore from './BaseStore';

class UserStore extends BaseStore {
  constructor() {
    super([]);
  }
  async initialize() {
    if (super.initialize()) {
      return this.refresh();
    }
  }
  async refresh() {
    console.log("UserStore fetching data");
    return userService.get().then(users => {
      this.setState(users);
    });
  }
}

const userStore = new UserStore();
export default userStore;