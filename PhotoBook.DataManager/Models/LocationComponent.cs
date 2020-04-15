using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using System.Text;

namespace PhotoBook.DataManager.Models
{
    public class LocationComponent : AuditableEntity
    {
        /// <summary>
        /// The (suppressed) ID of the database record.
        /// </summary>
        [IgnoreDataMember]
        [NotMapped]
        public override long Id
        {
            get { return -1; }
            set { Id = value; }
        }

        public long LocationId { get; set; }
        public Location Location { get; set; }

        public long ComponentId { get; set; }
        public GoogleAddressComponent Component { get; set; }
    }
}
