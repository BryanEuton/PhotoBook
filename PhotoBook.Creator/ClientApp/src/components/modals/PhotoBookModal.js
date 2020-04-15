import React, { Component } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import googleMapsService from '../services/GoogleMapsService';
import GoogleMapReact from 'google-map-react';
import { stopEvent } from '../../utils';
import { photoService } from '../services';


function getMapBounds(map, maps, places, addMarkerListener) {
  const bounds = new maps.LatLngBounds(map.center);

  places.forEach((place) => {
    const marker = new maps.Marker({
      map: map,
      position: new maps.LatLng(place.lat, place.lng),
      label: place.name
    });
    addMarkerListener(marker, place);
    bounds.extend(marker.position);
    return marker;
  });
  return bounds;
}
// Re-center map when resizing the window
function bindResizeListener(map, maps, bounds) {
  maps.event.addDomListenerOnce(map, 'idle', () => {
    maps.event.addDomListener(window, 'resize', () => {
      map.fitBounds(bounds);
    });
  });
}

export class PhotoBookModal extends Component {
  constructor(props) {
    super(props);

    this.foundPhotos = {};
    this.cancel = this.cancel.bind(this);
    this.save = this.save.bind(this);
    this.apiIsLoaded = this.apiIsLoaded.bind(this);
    this.state = { settings: {}, ready: false, locations: [], canSave: false, selectedMarker: {}, selectedPhotos: [] };

  }
  componentDidMount() {
    if (this.props.locations && this.props.photoBook && this.props.photoBook.photos) {
      const places = this.props.locations
        .filter(l => l.latitude !== null && l.longitude !== null && this.props.photoBook.photos.find(p => p.locationId === l.id))
        .map(l => {
          return Object.assign({}, l, { lat: l.latitude, lng: l.longitude, name: l.name || this.props.photoBook.photos.find(p => p.locationId === l.id).fileName })
        });
      this.setState({ places });
      this.loadGoogleSettings();  
    }
  }
  loadGoogleSettings() {
    googleMapsService.getSettings().then(settings => {
      this.setState({
        settings,
        ready: true
      });
    });
  }
  cancel(e) {
    stopEvent(e);
    if (this.props.onClose) {
      this.props.onClose(false);
    }
  }
  save(e) {
    stopEvent(e);
    if (this.props.onClose) {
      this.props.onClose(true, this.state.place);
    }
  }
  

  // Fit map to its bounds after the api is loaded
  apiIsLoaded(map, maps) {
    this.geocoder = new maps.Geocoder();
    this.geocoderStatusOk = maps.GeocoderStatus.OK;
    this.maps = maps;
    this.map = map;
    this.infoWindow = new maps.InfoWindow({ content: "" });
    this.infoWindow.setContent(this.infoWindowContent || "");

    if (this.state.places.length) {
        // Get bounds by our places
        const bounds = getMapBounds(map,
          maps,
          this.state.places,
          (marker, place) => {

            marker.addListener('click',
              () => {
                this.infoWindow.open(this.map, marker);
                const selectedPhotos = this.props.photoBook.photos.filter(p => p.locationId === place.id);
                this.setState({ selectedMarker: place, selectedPhotos });
              });
          });
        // Fit map to bounds
        this.map.fitBounds(bounds);
        this.map.panToBounds(bounds);
        // Bind the resize listener
        bindResizeListener(map, maps, bounds);
    }
  }
  
  renderGoogleMaps() {
    const center = this.state.places[0];

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
    let maps = this.state.ready ? (this.state.places.length > 0 ? this.renderGoogleMaps() : <p><em>No Locations found</em></p>) : <p><em>Loading...</em></p>;

    return (
      <Modal isOpen={true} toggle={this.cancel} className="photo-book-map" size="lg">
        <ModalHeader toggle={this.cancel}>{this.props.photoBook.title}</ModalHeader>

        <ModalBody>
          <div className="info-window-content" ref={node => {this.infoWindowContent = node;}}>
            <span><strong>{this.state.selectedMarker.name}</strong></span>
            <span><strong>Place Id: </strong>{this.state.selectedMarker.placeId}</span>
            <span>{this.state.selectedMarker.dropdownFormatted}</span>
            { !(this.props.photoBook && this.props.photoBook.photos) ? null : 
              <div>
                <span>{this.props.photoBook.photos.filter(p => p.locationId === this.state.selectedMarker.id).length} photos</span>
                {this.props.photoBook.photos.filter(p => p.locationId === this.state.selectedMarker.id).map(img =>
                  <img key={img.id} src={`/images/get/${img.id}`} alt={img.fileName} />
                )}
              </div>
            }
            
          </div>
          {maps}
        </ModalBody>

        <ModalFooter>
          <Button color="secondary" onClick={this.cancel}>Close</Button>
        </ModalFooter>
      </Modal>
    );
  }
}
