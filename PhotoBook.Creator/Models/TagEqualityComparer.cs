using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PhotoBook.Creator.Models
{
    public class TagEqualityComparer : IEqualityComparer<TagDto>
    {
        public bool Equals(TagDto x, TagDto y)
        {
            return x.Id.Equals(y.Id);
        }

        public int GetHashCode(TagDto obj)
        {
            return obj.Id.GetHashCode();
        }
    }
}