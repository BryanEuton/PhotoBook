using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace PhotoBook.Creator.Models
{
    public class LocationDto
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public string PlaceId { get; set; }
        public float? Latitude { get; set; }
        public float? Longitude { get; set; }
        public string StreetNumber { get; set; }
        public string StreetAddress { get; set; }
        public string Neighborhood { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string County { get; set; }
        public string Country { get; set; }
        public string PostalCode { get; set; }

        public string Formatted => $"{StreetNumber} {StreetAddress}<br /> {City}, {State} {PostalCode}";
        public string DropdownFormatted => $"{StreetNumber} {StreetAddress}, {City}, {State} {PostalCode}";
    }
}