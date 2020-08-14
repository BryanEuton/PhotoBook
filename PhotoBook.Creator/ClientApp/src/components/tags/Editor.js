import React, { Component } from 'react';
import { tagStore } from '../stores';
import { Button} from 'reactstrap';
import tagService from '../services/TagService';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import { Formik } from 'formik';
import * as Yup from 'yup';

export class TagEditor extends Component {
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
      name: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Required'),
      type: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Required')
    });

    this.state = {
      id,
      ready: this.isNew ? true : false,
      initialValues: {
        id,
        name: '',
        type: ''
      }
    };
  }
  componentDidMount() {
    if (!this.isNew) {
      this.subscriptions.push(tagStore.subscribe(state => this.handleTagStoreChange(state)));
    }
  }
  componentWillUnmount() {
    if (this.subscriptions !== null) {
      this.subscriptions.map(s => s());
    }
    this.subscriptions.length = 0;
  }

  handleTagStoreChange(state) {
    if (!this.state.ready) {
      const tag = state.tags.find(t => t.id === this.state.id);
      if (tag) {
        this.setState({
          initialValues: tag || this.state.initialValues,
          ready: true
        });
      }
    }
  }
  handleSubmit = (tag, actions) => {

    const api = this.isNew ? tagService.create : tagService.update;
    api(tag).then(result => {
      if (result) {
        //when creating, should we add this new entry to the TagStore?
        window.location = `/Tags/${result.type}`;
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
        }) => (
            <Form noValidate onSubmit={handleSubmit} className="tag-form" autoComplete="off">
              <Form.Row>
                <Form.Group as={Col} md="12" controlId="validationName">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    placeholder="Tag name"
                    isValid={touched.name && !errors.name}
                  />
                  <Form.Control.Feedback type="invalid">Please enter a name</Form.Control.Feedback>
                </Form.Group>
              </Form.Row>
              <Form.Row>
                <Form.Group as={Col} md="12" controlId="validationType">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="type"
                    value={values.type}
                    onChange={handleChange}
                    placeholder="Tag Type"
                    isValid={touched.type && !errors.type}
                  />
                  <Form.Control.Feedback type="invalid">Please enter a tag type</Form.Control.Feedback>
                </Form.Group>
              </Form.Row>

              <Button color="primary" type="submit" disabled={this.state.isSubmitting || !isValid}>Submit</Button>
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