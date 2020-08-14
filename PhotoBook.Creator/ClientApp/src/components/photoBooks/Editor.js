import React, { Component } from 'react';
import Select from 'react-select';
import { photoBookStore, userStore } from '../stores';
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
        timeFrame: '',
        whitelist: '',
        blacklist: ''
      },
      users: []
    };
  }
  componentDidMount() {
    if (!this.isNew) {
      this.subscriptions.push(photoBookStore.subscribe(state => this.handlePhotoBookStoreChange(state)));
    }
    this.subscriptions.push(userStore.subscribe(state => this.handleUserStoreChange(state)));
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
        this.fixListToObjectList(photoBook, 'whitelist');
        this.fixListToObjectList(photoBook, 'blacklist');
        this.setState({
          initialValues: photoBook,
          ready: true
        });
      }
    }
  }
  fixListToObjectList(obj, id) {
    if (Array.isArray(obj[id])) {
      obj[id] = obj[id].map(str => {
        const userId = str.value ? str.value : str;
        var user = this.state.users.find(u => u.value === userId);
        return {
          label: user ? user.label : "loading",
          value: userId
        };
      });
    } else {
      debugger;
    }
  }
  handleUserStoreChange(users) {
    if (users) {
      const userMap = users.map(u => {
        return {
          label: u.displayName,
          value: u.id
        };
      }); 
      this.setState({
        users: userMap
      });
      if (this.state.ready && this.state.initialValues) {
        //photobook already setup
        const photoBook = this.state.initialValues;
        if (photoBook.whitelist) {
          this.fixListToObjectList(photoBook, 'whitelist');
          this.fixListToObjectList(photoBook, 'blacklist');
        }
        this.setState({
          initialValues: photoBook
        });
      }
    }
  }
  handleSubmit = (pb, actions) => {
    const api = this.isNew ? photoBookService.create : photoBookService.update,
      photoBook = Object.assign({}, pb);
    if (photoBook.whitelist && photoBook.whitelist.length > 0) {
      photoBook.whitelist = photoBook.whitelist.map(u => u.value);
      photoBook.whitelistIds = '|' + photoBook.whitelist.join('|') + '|';
    }
    if (photoBook.blacklist && photoBook.blacklist.length > 0) {
      photoBook.blacklist = photoBook.blacklist.map(u => u.value);
      photoBook.blacklistIds = '|' + photoBook.blacklist.join('|') + '|';
    }
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
          setFieldValue,
          setFieldTouched,
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
              <Form.Row>
                <Form.Group as={Col} md="12" controlId="validationType">
                  <Form.Label>Allowed Users</Form.Label>
                  <Select 
                    placeholder="Allowed Users"
                    value={values.whitelist}
                    onChange={value => {
                      setFieldValue("whitelist", value);
                    }}
                    options={this.state.users}
                    touched={setFieldTouched}
                    isMulti={true}
                    isClearable={true}
                    backspaceRemovesValue={true}
                    components={{ ClearIndicator: null }}
                  />
                </Form.Group>
              </Form.Row>
              <Form.Row>
                <Form.Group as={Col} md="12" controlId="validationType">
                  <Form.Label>Blocked Users</Form.Label>
                  <Select
                    placeholder="Blocked Users"
                    value={values.blacklist}
                    onChange={value => {
                      setFieldValue("blacklist", value);
                    }}
                    options={this.state.users}
                    touched={setFieldTouched}
                    isMulti={true}
                    isClearable={true}
                    backspaceRemovesValue={true}
                    components={{ ClearIndicator: null }}
                  />
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