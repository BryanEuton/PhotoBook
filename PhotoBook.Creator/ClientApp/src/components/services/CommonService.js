import React from 'react';
import { toast } from 'react-toastify';

export const ToastUndo = ({ id, undo, undoArgs, closeToast, text }) => {
    function handleClick() {
        undo(undoArgs);
        closeToast();
    }

    return (
        <div>
            <p dangerouslySetInnerHTML={{ __html: text }}></p>
            <button className="btn" onClick={handleClick}>undo</button>
        </div>
    );
}

export const ShowToastWithUndo = function(id, undo, text){
    var rendering = (
        <div>
            <p dangerouslySetInnerHTML={{ __html: text }}></p>
            <button className="btn" onClick={undo}>undo</button>
        </div>
    );
    if (toast.isActive(id)) {
        return toast.update(id, { render: rendering });
    } else {
        return toast.success(rendering, { toastId: id});
    }
};
export const ShowSuccessToast = function (id, text) {
  if (toast.isActive(id)) {
      return toast.update(id, { render: text });
  } else {
      return toast.success(text, { toastId: id });
  }
};