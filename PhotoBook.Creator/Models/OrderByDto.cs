using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace PhotoBook.Creator.Models
{
    public class OrderByDto
    {
        public string Name { get; set; }
        public bool Asc { get; set; }
        public List<long>  Tags { get; set; }
    }
}