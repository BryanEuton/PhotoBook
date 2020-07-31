import { toast } from 'react-toastify';
import faceStore from '../stores/FaceStore';
import { BaseService } from './BaseService';

var toastPrefix = ":fc";
export class FaceService extends BaseService {
  removeToast(imageId, faceId) {
    if (toast.isActive(imageId + ":fc" + faceId)) {
      toast.dismiss(imageId + ":fc" + faceId);
    }
  }

  async get(id) {
    return this._get('/api/faces/Get?id=' + id);
  }
  async getFaces(imageId) {
    return this._get('/api/faces/GetFaces?imageId=' + imageId);
  }
  async updateFace(url, args, toastId, undoFn /*args: isProcessing, undo/redo, results */) {
    return this._post(url, args, toastId, (isProcessing, undoOrRedo, results) => {
      if (results) {
        faceStore.update(results);
      }
      if (typeof undoFn === 'function') {
        undoFn(isProcessing, undoOrRedo, results);
      }
      return results;
    } , true).then(results => {
      if (results) {
        faceStore.update(results);
      }
      return results;
    });
  }
  async save(face, imageId, undoFn /*args: isProcessing, undo/redo */) {
    let postArgs = Object.assign({ imageId: imageId }, face),
      toastId = imageId + toastPrefix + face.id;
    postArgs.x = Math.round(postArgs.x);
    postArgs.y = Math.round(postArgs.y);
    postArgs.width = Math.round(postArgs.width);
    postArgs.height = Math.round(postArgs.height);

    return this.updateFace('/api/Faces/Save/', postArgs, toastId, undoFn, true);
  }
  async setTag(face, undoFn /*args: isProcessing, undo/redo */) {
    let postArgs = Object.assign({}, face),
      toastId = face.imageId + toastPrefix + face.id;
    if (postArgs.tagId > 0 && postArgs.name) {
      postArgs.name = null;
    }
    return this.updateFace('/api/Faces/Tag/', postArgs, toastId, undoFn, true);
  }
  async remove(id, imageId, undoFn /* inProgress, undo/redo */) {
    let toastId = imageId + toastPrefix + id;
    
    return this.updateFace(`/api/Faces/Remove?id=${id}`, null, toastId, undoFn, true);
  }
  async removeAllFaces(imageId, undoFn /*args: updating, id, [face]*/) {
    let toastId = imageId + toastPrefix + "all";

    return this.updateFace(`/api/Faces/RemoveAll?thumbnailId=${imageId}`, null, toastId, undoFn, true);
  }

  async validate(face, undoFn /*args: updating, id, face*/) {
    let toastId = face.imageId + toastPrefix + face.id;
    return this.updateFace(`/api/Faces/Validate?id=${face.id}`, null, toastId, undoFn, true);
  }
  async search(params, terms) {
    return this._post('/api/faces/PagedResults/', params).then(res => {
      if (res.data && res.data.success) {
        return { terms, results: res.data.results, totalResults: res.data.totalResults, resultsOrder: res.data.resultsOrder };
      }
      return null;
    });
  }
  async find(params, terms) {
    return this._post('/api/faces/Find/', params).then(res => {
      if (res.data && res.data.success) {
        return { terms, results: res.data.results, totalResults: res.data.totalResults, resultsOrder: res.data.resultsOrder };
      }
      return null;
    });
  }

  static get instance() { return faceService; }
};

const faceService = new FaceService();

export default faceService;