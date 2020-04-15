import React, { Component } from 'react';
import { photoBookStore } from '../stores';
import { Button} from 'reactstrap';
import photoBookService from '../services/PhotoBookService';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import { Formik } from 'formik';
import * as Yup from 'yup';

export class PhotoBookEditor extends Component {
  constructor(props) {
    super(props);

    this.subscriptions = [];
    let id = 0;
    if (this.props.match && this.props.match.params && this.props.match.params.id) {
      //do something
      id = Number(this.props.match.params.id);
    }
    this.isNew = id === 0;
    this.schema = Yup.object().shape({
      title: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Required'),
      timeFrame: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Required')
    });

    this.state = {
      id,
      ready: this.isNew ? true : false,
      initialValues: {
        id,
        title: '',
        timeFrame: ''
      }
    };
  }
  componentDidMount() {
    if (!this.isNew) {
      this.subscriptions.push(photoBookStore.subscribe(state => this.handlePhotoBookStoreChange(state)));
    }
  }
  componentWillUnmount() {
    if (this.subscriptions !== null) {
      this.subscriptions.map(s => s());
    }
    this.subscriptions.length = 0;
  }

  handlePhotoBookStoreChange(photoBooks) {
    if (!this.state.ready) {
      const photoBook = photoBooks.find(t => t.id === this.state.id);
      if (photoBook) {
        this.setState({
          initialValues: photoBook,
          ready: true
        });
      }
    }
  }
  handleSubmit = (photoBook, actions) => {

    const api = this.isNew ? photoBookService.create : photoBookService.update;
    api(photoBook).then(result => {
      if (result) {
        //when creating, should we add this new entry to the PhotoBookStore?
        window.location = '/PhotoBooks';
      }
    });
  }

  renderForm() {

    return (
      <Formik
        validationSchema={this.schema}
        onSubmit={this.handleSubmit}
        initialValues={this.state.initialValues}
      >
        {({
          handleSubmit,
          handleChange,
          handleBlur,
          values,
          touched,
          isValid,
          errors,
          dirty
        }) => (
            <Form noValidate onSubmit={handleSubmit} className="photoBook-form" autoComplete="off">
              <Form.Row>
                <Form.Group as={Col} md="12" controlId="validationName">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="title"
                    value={values.title}
                    onChange={handleChange}
                    placeholder="Enter title"
                    isValid={touched.title && !errors.title}
                  />
                  <Form.Control.Feedback type="invalid">Please enter a title</Form.Control.Feedback>
                </Form.Group>
              </Form.Row>
              <Form.Row>
                <Form.Group as={Col} md="12" controlId="validationType">
                  <Form.Label>TimeFrame</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="timeFrame"
                    value={values.timeFrame}
                    onChange={handleChange}
                    placeholder="Enter time frame"
                    isValid={touched.timeFrame && !errors.timeFrame}
                  />
                  <Form.Control.Feedback type="invalid">Please enter a time frame</Form.Control.Feedback>
                </Form.Group>
              </Form.Row>

              <Button color="primary" type="submit" disabled={this.state.isSubmitting || !isValid || !dirty}>Submit</Button>
            </Form>
          )}
      </Formik>
    );
  }
  render() {
    if (this.state.ready) {
      return this.renderForm();
    }
    return (<p><em>Loading...</em></p>);
  }
}