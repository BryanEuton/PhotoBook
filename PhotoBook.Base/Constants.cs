using System;

namespace PhotoBook.Base
{
    public static class Constants
    {
        //Image
        public const int ThumbnailResizedWidth = 320;

        public static class Tags
        {
            public const string PersonTagType = "Person";
            public const long PersonTagTypeId = 1;
            public const string LocationTagType = "Location";
            public const string StateTagType = "State";
            public const string UnknownTag = "Unknown";
            public const long UnknownTagId = 1;
        }

        //Exif 
        public const int ExifLatitudeRefPropertyId = 1;
        public const int ExifLatitudePropertyId = 2;
        public const int ExifLongitudeRefPropertyId = 3;
        public const int ExifLongitudePropertyId = 4;
        public const int ExifAltitudeRefPropertyId = 5;
        public const int ExifAltitudePropertyId = 6;
        public const int ExifCreateDatePropertyId = 36867;
        public const int ExifOrientationId = 274;

        
        //Face Status
        public class FaceStatus
        {
            public const int New = 1;
            public const int Visible = 2;
            public const int Hidden = 3;
            public const int Validated = 4;
        }

        //Misc
        public const string Manual = "Manual";
    }
}
