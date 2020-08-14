using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;

namespace PhotoBook.DataManager.Models
{
    public class GoogleAddressComponent : AuditableEntity
    {
        public string LongName { get; set; }
        public string ShortName { get; set; }

        public string TypesString { get; set; }

        private List<GoogleAddressType> _types;

        [NotMapped]
        public List<GoogleAddressType> Types
        {
            get
            {
                return _types ?? (_types = TypesString.Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries)
                           .Select(t => (GoogleAddressType)int.Parse(t)).ToList());
            }
            set
            {
                _types = value;
                TypesString = "|" + string.Join("|", value.OrderBy(t => t)) + "|";
            }
        }

        public virtual ICollection<LocationComponent> LocationComponents { get; set; } = new HashSet<LocationComponent>();
    }
}
