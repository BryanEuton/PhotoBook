using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PhotoBook.Creator.Models
{
    public class FaceDto
    {
        public long ImageId { get; set; }
        public long Id { get; set; }
        public double Distance { get; set; }
        public bool IsValid { get; set; }
        public bool IsNew { get; set; }
        public bool IsHidden { get; set; }
        public long TagId { get; set; }
        public string Name { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public int ImageWidth { get; set; }
        public int ImageHeight { get; set; }
    }
}