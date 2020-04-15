import authService from '../api-authorization/AuthorizeService';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShowToastWithUndo } from './CommonService';
import { locationStore } from '../stores';

export class LocationService {
  async get() {
    try {
        const token = await authService.getAccessToken();
        if (!token) {
            return [];
        }
        const response = await axios
            .get(
                '/api/location/get',
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
        return response.data;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to get locations. ${e}`);
      }
      return [];
    }
  }
  async getStates() {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return [];
      }
      const response = await axios
        .get(
          '/api/location/getStates',
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      return response.data;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to get states. ${e}`);
      }
      return [];
    }
  }
  async getCities() {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return [];
      }
      const response = await axios
        .get(
          '/api/location/getCities',
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      return response.data;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to get cities. ${e}`);
      }
      return [];
    }
  }

  async toggleImage(locationId, imageId, oldId, updateFn) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
          return [];
      }
      return fetch('/api/Location/TogglePhoto?locationId=' + locationId + '&thumbnailId=' + imageId,
            {
                headers: !token ? {} : { 'Authorization': `Bearer ${token}` },
                method: 'POST'
            })
        .then(response => response.json())
        .then(data => {
            if (data && data.success) {
                ShowToastWithUndo("lc:" + imageId, () => { /* undo toggle location */
                    updateFn(null, 1/* Updating */);
                    locationService.toggleImage(oldId/*swap old versus new */, imageId, locationId, updateFn)
                        .then(undoData => {
                            if (undoData && undoData.success) {
                                updateFn(oldId, 0);
                            }
                        });
                }, data.message);
                //toast.success(data.message || "Toggled Location for Image", {onClose: onToastClosed});
            } else {
                toast.error((data && data.message) || "Failed to toggle Location for Image.");
            }
            return data;
        });
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to toggle Location for Image. ${e}`);
      }
    }
  }
  async newLocation(place, imageId, oldId, updateFn) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return [];
      }
      place.thumbnailId = imageId;
      const response = await axios
        .post(
          '/api/location/SetLocation/',
          place,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      if (response.data && response.data.success) {
        ShowToastWithUndo("lc:" + imageId, () => {
          /* undo toggle location */
          updateFn(null, 1/* Updating */);
          locationService.toggleImage(oldId/*swap old versus new */, imageId, response.data.results.locationId, updateFn)
            .then(undoData => {
              if (undoData && undoData.success) {
                  updateFn(oldId, 0);
              }
            });
        }, response.data.message);
        if (response.data.results) {
          locationStore.addEntry(response.data.results);
        }
        return response.data.results;
      } else {
        toast.error((response.data && response.data.message) || "Failed to toggle Location for Image.");
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to set Location for Image. ${e}`);
      }
    }
  }

  static get instance() { return locationService }
};

const locationService = new LocationService();

export default locationService;