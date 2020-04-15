using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PhotoBook.DataManager.Models
{
    /// <summary>
    /// This abstract class ensures that every
    /// entity is trackable and serves as a class constraint
    /// for generic methods.
    /// </summary>
    public abstract class AuditableEntity
    {
        /// <summary>
        /// The primary identifier for this record
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public virtual long Id { get; set; }

        /// <summary>
        /// The date and time this record was created
        /// </summary>
        [Required]
        public DateTime Created { get; set; }

        /// <summary>
        /// The user ID who created this record.
        /// </summary>
        [MaxLength(128)]
        public string CreatedBy { get; set; }

        /// <summary>
        /// The date and time this record was last edited.
        /// </summary>
        public DateTime? LastUpdated { get; set; }

        /// <summary>
        /// The last user ID who edited this record.
        /// </summary>
        [MaxLength(128)]
        public string LastUpdatedBy { get; set; }
    }
}
