import React from 'react';
import { stopEvent } from '../../utils';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';


export const DeleteModal = props => {
  function cancel(e) {
    stopEvent(e);
    if (props.onClose) {
      props.onClose(false);
    }
  };

  function handleDelete() {
    if (props.onClose) {
      props.onClose(true);
    }        
  }
  return (
    <Modal isOpen={true} toggle={cancel} className="delete-modal" size="lg">
      <ModalHeader toggle={cancel}>props.title</ModalHeader>
      <ModalBody>
        {props.body}
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={handleDelete}>Confirm</Button>{' '}
        <Button color="secondary" onClick={cancel}>Cancel</Button>
      </ModalFooter>
    </Modal>
  );
};