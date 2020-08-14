using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PhotoBook.Creator.Models
{
    public class CityEqualityComparer : IEqualityComparer<CityDto>
    {
        public bool Equals(CityDto x, CityDto y)
        {
            return Equals(x.State, y.State) && Equals(x.Name, y.Name);
        }

        public int GetHashCode(CityDto obj)
        {
            return $"{obj.State}-{obj.Name}".GetHashCode();
        }
    }
}