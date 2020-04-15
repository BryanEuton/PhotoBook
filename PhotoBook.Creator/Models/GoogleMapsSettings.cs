using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PhotoBook.Creator.Models
{
    public class GoogleMapsSettings
    {
        public string ApiKey { get; set; }
        public decimal DefaultLongitude { get; set; }
        public decimal DefaultLatitude { get; set; }
        public decimal DefaultZoom { get; set; }
    }
}
