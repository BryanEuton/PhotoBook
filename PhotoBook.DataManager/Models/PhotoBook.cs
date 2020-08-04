using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;

namespace PhotoBook.DataManager.Models
{
    public class PhotoBook : AuditableEntity
    {
        [Required(ErrorMessage = "Title is required")]
        [MaxLength(100)]
        public string Title { get; set; }

        [Required(ErrorMessage = "TimeFrame is required")]
        [MaxLength(100)]
        public string TimeFrame { get; set; }

        public virtual ICollection<PhotoItem> Photos { get; set; } = new HashSet<PhotoItem>();
        
        /// <summary>
        /// Encapsulated ids of whitelisted users who can view the photo book
        /// </summary>
        public string WhitelistIds { get; set; }

        /// <summary>
        /// Encapsulated ids of blacklisted users who cannot view the photo book
        /// </summary>
        public string BlacklistIds { get; set; }

        [NotMapped]
        public List<string> Whitelist
        {
            get => (WhitelistIds ?? string.Empty).Split(new []{'|'}, StringSplitOptions.RemoveEmptyEntries).ToList();
            set => WhitelistIds = value == null ? string.Empty : "|" + string.Join('|', value) + "|";
        }
        [NotMapped]
        public List<string> Blacklist
        {
            get => (BlacklistIds ?? string.Empty).Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries).ToList();
            set => BlacklistIds = value == null ? string.Empty : "|" + string.Join('|', value) + "|";
        }
    }
}
