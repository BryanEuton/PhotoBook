using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace PhotoBook.DataManager.Models
{
    public class Location : AuditableEntity
    {
        public string Name { get; set; }
        public string PlaceId { get; set; }
        public float? Latitude { get; set; }
        public float? Longitude { get; set; }
        public virtual ICollection<Thumbnail> Thumbnails { get; set; } = new HashSet<Thumbnail>();
        public virtual ICollection<LocationComponent> LocationComponents { get; set; } = new HashSet<LocationComponent>();

        public string StreetNumber
        {
            get { return LocationComponents.FirstOrDefault(lc=> lc.Component.Types.Any(t => t == GoogleAddressType.StreetNumber))?.Component.LongName; }
        }
        public string StreetAddress
        {
            get { return LocationComponents.FirstOrDefault(lc => lc.Component.Types.Any(t => t == GoogleAddressType.StreetAddress || t == GoogleAddressType.Route))?.Component.LongName; }
        }
        public string Neighborhood
        {
            get { return LocationComponents.FirstOrDefault(lc => lc.Component.Types.Any(t => t == GoogleAddressType.Neighborhood))?.Component.LongName; }
        }
        public string City
        {
            get { return LocationComponents.FirstOrDefault(lc => lc.Component.Types.Any(t => t == GoogleAddressType.Locality))?.Component.LongName; }
        }
        public string State
        {
            get { return LocationComponents.FirstOrDefault(lc => lc.Component.Types.Any(t => t == GoogleAddressType.AdministrativeAreaLevel1))?.Component.LongName; }
        }
        public string County
        {
            get { return LocationComponents.FirstOrDefault(lc => lc.Component.Types.Any(t => t == GoogleAddressType.AdministrativeAreaLevel2))?.Component.LongName; }
        }
        public string Country
        {
            get { return LocationComponents.FirstOrDefault(lc => lc.Component.Types.Any(t => t == GoogleAddressType.Country))?.Component.LongName; }
        }
        public string PostalCode
        {
            get { return LocationComponents.FirstOrDefault(lc => lc.Component.Types.Any(t => t == GoogleAddressType.PostalCode))?.Component.LongName; }
        }
    }
}
