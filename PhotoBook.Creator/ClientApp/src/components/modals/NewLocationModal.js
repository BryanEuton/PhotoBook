import React, { Component } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import googleMapsService from '../services/GoogleMapsService';
import GoogleMapReact from 'google-map-react';
import ReactDOMServer from 'react-dom/server';
import { stopEvent } from '../../utils';
import $ from 'jquery';

export class NewLocationModal extends Component {
  constructor(props) {
    super(props);

    this.renderGoogleMaps = this.renderGoogleMaps.bind(this);
    this.cancel = this.cancel.bind(this);
    this.save = this.save.bind(this);
    this.getMapBounds = this.getMapBounds.bind(this);
    this.bindResizeListener = this.bindResizeListener.bind(this);
    this.apiIsLoaded = this.apiIsLoaded.bind(this);
    this.updateInfoWindow = this.updateInfoWindow.bind(this);
    this.state = { settings: {}, ready: 0, places: this.props.places || [], place: this.props.place || {}, canSave: false };

  }
  componentDidMount() {
    this.loadGoogleSettings();
  }
  loadGoogleSettings() {
    googleMapsService.getSettings().then(settings => {
      this.setState({
        settings: settings,
        ready: 1
      });
    });
  }
  cancel(e) {
    stopEvent(e);
    if (this.props.onClose) {
      this.props.onClose(0);
    }
  }
  save(e) {
    stopEvent(e);
    if (this.props.onClose) {
      this.props.onClose(1, this.state.place);
    }
  }
  
  // Return map bounds based on list of places
  getMapBounds(map, maps, places) {
    const bounds = new maps.LatLngBounds(map.center);

    places.forEach((place) => {
      bounds.extend(new maps.LatLng(
        place.geometry.location.lat,
        place.geometry.location.lng,
      ));
    });
    return bounds;
  }

  // Re-center map when resizing the window
  bindResizeListener(map, maps, bounds) {
    maps.event.addDomListenerOnce(map, 'idle', () => {
      maps.event.addDomListener(window, 'resize', () => {
        map.fitBounds(bounds);
      });
    });
  }

  // Fit map to its bounds after the api is loaded
  apiIsLoaded(map, maps) {
    this.geocoder = new maps.Geocoder();
    this.geocoderStatusOk = maps.GeocoderStatus.OK;
    this.maps = maps;
    this.map = map;
    this.infoWindow = new maps.InfoWindow({ content: "" });
    //const inputStr = ReactDOMServer.renderToString(
    //  <input className="controls" type="text" placeholder="Enter a location" />
    //);
    //const input = $(inputStr).get(0);
    const autocomplete = new maps.places.Autocomplete(this.pacInput);
    autocomplete.bindTo('bounds', this.map);

    // Specify just the place data fields that you need.
    autocomplete.setFields(['place_id', 'geometry', 'name', 'address_components', 'icon']);
    this.map.controls[maps.ControlPosition.TOP_RIGHT].push(this.pacInput);

    this.marker = new maps.Marker({
      map: map,
      draggable: true,
      position: this.state.place.latitude ? new maps.LatLng(this.state.place.latitude, this.state.place.longitude) : null
    });
    this.marker.addListener('click', () => {
      this.infoWindow.open(this.map, this.marker);
    });
    this.map.addListener('click', (e) => {
      this.marker.setPosition(e.latLng);
      this.marker.setVisible(true);
      this.map.panTo(e.latLng);
      this.getPlaceFromLocation(e.latLng);
    });
    this.marker.addListener('dragend', (e) => {
      this.getPlaceFromLocation(e.latLng);
    });
    this.updateInfoWindow();

    autocomplete.addListener('place_changed', () => {
      this.infoWindow.close();

      var place = autocomplete.getPlace();

      if (!place.geometry) {
        return;
      }

      // Set the position of the marker using the place ID and location.
      this.marker.setPlace({
        placeId: place.place_id,
        location: place.geometry.location
      });
      this.updateMarker(place);
      this.marker.setVisible(true);
    });
  }
  getPlaceFromLocation(latLng) {
    if (this.state.canSave) {
      this.setState({ canSave: false });
    }
    if (!latLng) {
      return;
    }
    this.geocoder.geocode({
      'location': latLng
    }, (results, status) => {
      if (status === this.geocoderStatusOk) {
        if (results.length) {
          this.updateMarker(results[0]);
        }
      } else {
        console.log('Geocoder failed due to: ' + status);
      }
    });
  }
  updateMarker(place) {
    if (!place.geometry) {
      return;
    }
    if (place.geometry.viewport) {
      this.map.fitBounds(place.geometry.viewport);
    } else {
      this.map.setCenter(place.geometry.location);
      this.map.setZoom(17);
    }
    let name = place.name;
    if (!name) {
      const streetNumber = place.address_components.find(p => p.types.find(t => t === "street_number")),
        streetAddress = place.address_components.find(p => p.types.find(t => t === "street_address")) || place.address_components.find(p => p.types.find(t => t === "route"));
      if (streetNumber && streetAddress) {
        name = `${streetNumber.long_name} ${streetAddress.long_name}`;
      } else {
        name = place.formatted_address;
      }
    }

    this.setState({
      place: {
        id: place.place_id,
        placeId: place.place_id,
        components: place.address_components,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        name: name,
        formatted_address: place.formatted_address
      },
      canSave: true
    });
    this.updateInfoWindow();
  }
  updateInfoWindow() {
    //const content = ReactDOMServer.renderToString(InfowWindowContent);
    const contentStr = ReactDOMServer.renderToString(
      <div>
        <span id="place-name" className="title">{this.state.place.name}</span><br />
        <strong>Place ID:</strong> <span id="place-id">{this.state.place.placeId}</span><br />
        <span id="place-address"> {this.state.place.formatted_address} </span>
      </div>
    );
    const content = $(contentStr).get(0);
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, this.marker);
  }
  renderGoogleMaps() {
    const center = { lat: this.state.settings.defaultLatitude, lng: this.state.settings.defaultLongitude };

    return (
      <GoogleMapReact
        bootstrapURLKeys={{ key: this.state.settings.apiKey, libraries: 'places' }}
        defaultCenter={center}
        defaultZoom={this.state.settings.defaultZoom}
        yesIWantToUseGoogleMapApiInternals
        onGoogleApiLoaded={({ map, maps }) => this.apiIsLoaded(map, maps)}
      >
      </GoogleMapReact>
    );
  }
  render() {
    let maps = this.state.ready ? this.renderGoogleMaps() : <p><em>Loading...</em></p>;

    return (
      <Modal isOpen={true} toggle={this.cancel} className={"newLocation"} size="lg">
        <ModalHeader toggle={this.cancel}>Set Location</ModalHeader>

        <ModalBody>
          {maps}
          <input id="pac-input" type="text" placeholder="Enter a location" ref={r => { this.pacInput = r; }} />
        </ModalBody>

        <ModalFooter>
          <Button color="primary" onClick={this.save} disabled={!this.state.canSave}>Save</Button>{' '}
          <Button color="secondary" onClick={this.cancel}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }
}
