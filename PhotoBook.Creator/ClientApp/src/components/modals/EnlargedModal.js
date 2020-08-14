import React, { Component } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { stopEvent } from '../../utils';

export class EnlargedModal extends Component {
  close = (e) => {
    stopEvent(e);
    if (this.props.onClose) {
      this.props.onClose(false);
    }
  }
  render() {
    return (
      <Modal isOpen={true} toggle={this.close} className="enlarged-modal" size="lg">
        <ModalHeader toggle={this.close}>{this.props.img.fileName}</ModalHeader>

        <ModalBody>
          <img src={`/images/full/${this.props.id}`} alt={this.props.img.fileName} />
        </ModalBody>

        <ModalFooter>
          <Button color="primary" onClick={this.close}>Close</Button>
        </ModalFooter>
      </Modal>
    );
  }
}
