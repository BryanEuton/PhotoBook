import locationService from '../services/LocationService';
import BaseStore from './BaseStore';

class LocationStore extends BaseStore {
  constructor() {
    super({
      states: [],
      cities: [],
      locations: []
    });
  }
  async initialize() {
    if (!super.initialize()) {
      return this.getState();
    }
    console.log("LocationStore initializing");
    const loc = locationService.get().then(locations=> {
      const state = this.state;
      state.locations = locations.map(l => {
        l.type = 'location';
        return l;
      });
      this.setState(state);
    });
    const states = locationService.getStates().then(states=> {
      const state = this.state;
      state.states = states.map(s => { return { id: s, name: s, type: 'state' }; });
      this.setState(state);
    });
    const cities = locationService.getCities().then(cities => {
      const state = this.state;
      state.cities = cities.map(city => {
        return Object.assign({ id: city.state + "|" + city.name, type: 'city' }, city);
      });
      this.setState(state);
    });
    return loc.then(() => {
      return states.then(() => {
        return cities.then(() => {
          return null;
        });
      });
    });
  }
  addEntry(location) {
    if (!location || !location.id) {
      return false;
    }
    const state = this.state;
    if (state.locations.find(l => l.id === location.id)) {
      return false;
    }
    state.locations.push(location);
    if (!state.states.find(s => s.name === location.state)) {
      state.states.push({id: location.state, name: location.state, type: 'state'});//TODO: sort this by name
    }
    if (!state.cities.find(c => c.state === location.state && c.name === location.city)) {
      state.cities.push({ id: location.state + "|" + location.city, type: 'city', state: location.state, name: location.city });//TODO: sort this by name
    }
    this.setState(state);
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

const locationStore = new LocationStore();
export default locationStore;