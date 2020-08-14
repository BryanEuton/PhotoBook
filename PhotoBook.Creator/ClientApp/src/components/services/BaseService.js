import React from 'react';
import authService from '../api-authorization/AuthorizeService';
import axios from 'axios';
import { toast } from 'react-toastify';

const ShowToastWithUndo = function (id, undo, text) {
  var rendering = (
    <div>
      <p dangerouslySetInnerHTML={{ __html: text }}></p>
      <button className="btn" onClick={undo}>undo</button>
    </div>
  );
  if (toast.isActive(id)) {
    return toast.update(id, { render: rendering });
  } else {
    return toast.success(rendering, { toastId: id });
  }
};
const ShowSuccessToast = function (id, text) {
  if (toast.isActive(id)) {
    return toast.update(id, { render: text });
  } else {
    return toast.success(text, { toastId: id });
  }
};

export class BaseService {
  removeToast(imageId, faceId) {
    if (toast.isActive(imageId + ":fc" + faceId)) {
      toast.dismiss(imageId + ":fc" + faceId);
    }
  }
  serviceType = "ServiceType";
  
  async _get(url) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return [];
      }
      return fetch(url,
          {
            headers: !token ? {} : { 'Authorization': `Bearer ${token}` },
            method: 'GET'
          })
        .then(response => response.json())
        .then(data => {
          if (data && data.success) {
            return data.results;
          } else {
            toast.error((data && data.message) || `Failed to get ${this.serviceType}`);
          }
          return null;
        });
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`Server error getting ${this.serviceType}. ${e}`);
      }
    }
  }
  async _post(url, args, toastId, undoFn /*args: isProcessing, undo/redo, results */, isUndo) {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
          return [];
      }
      
      const response = await axios
          .post(
              url,
              args,
              {
                  headers: { 'Authorization': `Bearer ${token}` }
              }
      );
      if (typeof toastId === 'undefined') {
        return response;//handling internally.
      }
      if (response.data && response.data.success) {
        if (typeof response.data.undo !== 'undefined' && typeof response.data.undo.url !== 'undefined' && response.data.undo.url !== null) {
          const undo = response.data.undo;
          let service = this;
          ShowToastWithUndo(toastId,
            () => {
              if (typeof undoFn === "function") {
                undoFn(true);
              }
              service._post(undo.url, undo.args, toastId, undoFn, !isUndo)
                .then(results => {
                  if (typeof undoFn === "function") {
                    undoFn(false, isUndo, results);
                  }
                });
            }, response.data.message);
        } else {
          ShowSuccessToast(toastId, response.data.message || `Failed to process command for ${this.serviceType}`);
        }
        return response.data.results;
      }
      return null;
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        toast.error(e.response.data.error);
      } else {
        console.log(`A server error occurred while processing command for ${this.serviceType}. ${e}`, e);
      }
    }
  }
};
