import React from 'react';
import { commentStore } from '../stores';
import { commentService } from '../services';
import { stopEvent } from '../../utils';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap';


export const CommentModal = props => {
  const isNew = props.comment.id === 0,
    initialValues = Object.assign({ text: ''}, props.comment),
    title = isNew ? "Create a comment" : "Edit a comment",
    schema = Yup.object().shape({
      text: Yup.string()
        .min(2, 'Too Short!')
        .max(250, 'Too Long!')
        .required('Required')
    });
  let closing = false,
    isSubmitting = false;
  
  function cancel(e) {
    stopEvent(e);
    if (!closing && props.onClose) {
      closing = true;
      props.onClose(false);
    }
  };

  function handleSubmit(comment, actions) {
    const api = isNew ? commentService.create : commentService.update;
    isSubmitting = true;
    api(comment).then(result => {
      isSubmitting = false;
      if (result) {
        closing = true;
        if (isNew) {
          commentStore.addEntry(result);
        } else {
          commentStore.updateEntry(result);
        }
        if (props.onClose) {
          props.onClose(result);
        }        
      }
    });
  }
  return (
    <Modal isOpen={true} toggle={cancel} className="comment-modal" size="lg">
      <ModalHeader toggle={cancel}>{title}</ModalHeader>
      <ModalBody>
        <Formik
          validationSchema={schema}
          onSubmit={handleSubmit}
          initialValues={initialValues}
        >
          {({
            handleSubmit,
            handleChange,
            handleBlur,
            values,
            touched,
            isValid,
            errors,
          }) => (
              <Form noValidate onSubmit={handleSubmit} className="comment-form" autoComplete="off">
                <Form.Row>
                  <Form.Group as={Col} md="12" controlId="validationComment">
                    <Form.Label>Comment</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      name="text"
                      value={values.text}
                      onChange={handleChange}
                      placeholder="Enter Comment"
                      isValid={touched.text && !errors.text}
                    />
                    <Form.Control.Feedback type="invalid">Please enter a name</Form.Control.Feedback>
                  </Form.Group>
                </Form.Row>

                <Button color="primary" type="submit" disabled={isSubmitting || !isValid}>Submit</Button>{' '}
                <Button color="secondary" onClick={cancel}>Cancel</Button>
              </Form>
            )}
        </Formik>
      </ModalBody>
    </Modal>
  );
};