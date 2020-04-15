using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace PhotoBook.Creator.Models
{
    public class FileSystemFolderDto
    {
        public long Id { get; set; }

        public string Path { get; set; }
        public string Name { get; set; }
    }
}