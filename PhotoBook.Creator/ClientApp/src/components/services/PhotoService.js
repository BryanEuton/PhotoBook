import authService from '../api-authorization/AuthorizeService';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShowSuccessToast, ShowToastWithUndo } from './CommonService';

class PhotoService {

  async get(id) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return [];
      }
      return fetch('/api/Photos/Get?id=' + id,
          {
            headers: !token ? {} : { 'Authorization': `Bearer ${token}` },
            method: 'GET'
          })
        .then(response => response.json())
        .then(data => {
          if (data && data.success) {
            return data.results;
          } else {
            toast.error((data && data.message) || "Failed to get Image.");
          }
          return null;
        });
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to get Image. ${e}`);
      }
    }
  }
  async scan(id) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return [];
      }
      let toastId = 'scan:' + id;
      ShowSuccessToast(toastId, `Scanning image ${id}`);
      return fetch('/api/Photos/Scan?id=' + id,
          {
            headers: !token ? {} : { 'Authorization': `Bearer ${token}` },
            method: 'GET'
          })
        .then(response => response.json())
        .then(data => {
          if (data && data.success) {
            ShowSuccessToast(toastId, data.message);
            return data.results;
          } else {
            toast.error((data && data.message) || "Failed to get Image.");
          }
          return null;
        });
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to get Image. ${e}`);
      }
    }
  }
  
  async remove(id, img, undoFn /*args: updating, addItem, id, img*/,toastId) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
          return [];
      }
      return fetch('/api/Photos/Remove?id=' + id,
        {
            headers: !token ? {} : { 'Authorization': `Bearer ${token}` },
            method: 'POST'
        })
      .then(response => response.json())
      .then(data => {
        if (data && data.success) {
          toastId = toastId || ('img' + id);
          ShowToastWithUndo(toastId,
            () => {
              undoFn(true);
              photoService.remove(id, img, undoFn, toastId).then(removedItem => {
                if (removedItem != null) {
                  undoFn(false, !removedItem, id, img);
                }
              });
            }, data.message);
          
          return data.results;
        } else {
            toast.error((data && data.message) || "Failed to remove Image.");
        }
        return null;
      });
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Failed to remove Image. ${e}`);
      }
    }
  }
  static get instance() { return photoService; }
};

const photoService = new PhotoService();

export default photoService;