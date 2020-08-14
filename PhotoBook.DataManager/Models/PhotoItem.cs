using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using System.Text;

namespace PhotoBook.DataManager.Models
{
    public class PhotoItem : AuditableEntity
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

        /// <summary>
        /// The ID of the Thumbnail record.
        /// </summary>
        public long ThumbnailId { get; set; }

        /// <summary>
        /// The ID of the PhotoBook record.
        /// </summary>
        public long PhotoBookId { get; set; }


        public PhotoBook PhotoBook { get; set; }

        public virtual Thumbnail Thumbnail { get; set; }
    }
}
