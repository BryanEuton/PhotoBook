using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PhotoBook.DataManager.Models
{
    public class FileSystemFolder : AuditableEntity
    {
        [MaxLength(200)]
        public string Path { get; set; }

        public long? ParentId { get; set; }

        [ForeignKey("ParentId")]
        public virtual FileSystemFolder Parent { get; set; }
        public virtual ICollection<FileSystemFolder> Children { get; set; } = new HashSet<FileSystemFolder>();
        
    }
}