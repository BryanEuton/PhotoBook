using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace PhotoBook.Creator.Models
{
    public class GoogleAddressComponentDto
    {
        public string long_name { get; set; }
        public string short_name { get; set; }
        public List<string> types { get; set; }

        public string LongName => long_name;
        public string ShortName => short_name;
    }
}