using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using NLog;
using NLog.Extensions.Logging;
using Geocoding;
using Geocoding.Google;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using GoogleAddressComponent = PhotoBook.DataManager.Models.GoogleAddressComponent;
using GoogleAddressType = Geocoding.Google.GoogleAddressType;
using Location = PhotoBook.DataManager.Models.Location;
using PhotoBook.Base;
using PhotoBook.DataManager;
using PhotoBook.DataManager.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;
using PhotoBook.ImageProcessing;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Primitives;
using SixLabors.ImageSharp.Processing;


namespace PhotoBook.Common
{
    public class Helpers
    {
        /// <summary>
        /// A local logger for the class.
        /// </summary>
        public Logger Logger = LogManager.GetCurrentClassLogger();
        private readonly IHttpContextAccessor _httpContextAccessor;
        private static LoggerFactory MyLoggerFactory = new LoggerFactory(new[] { new NLogLoggerProvider() });

        private readonly bool _rescanAll;
        private readonly string _connectionString;
        private readonly IConfiguration _configuration;
        private readonly bool _writeImagesToLocal;
        private readonly string _imagesToLocalPath;
        private readonly double _minDistanceForFacialRecognition;
        private readonly int _minWidthForOverride;
        private readonly int _minHeightForOverride;
        private readonly int _maxTrainingImagesPerName;
        private readonly GoogleGeocoder _googleGeoCoder;
        private string PhotosLocation { get; }
        public Helpers(string photosLocation, IConfiguration configuration, IHttpContextAccessor httpContextAccessor, string connectionString)
        {
            PhotosLocation = photosLocation;
            _httpContextAccessor = httpContextAccessor;
            _minDistanceForFacialRecognition = double.Parse(configuration["ImageProcessing:MinimumDistanceForFacialRecognition"] ?? "1000");
            _minWidthForOverride = int.Parse(configuration["ImageProcessing:MinimumWidthForDistanceOverride"] ?? "100");
            _minHeightForOverride = int.Parse(configuration["ImageProcessing:MinimumHeightForDistanceOverride"] ?? "100");
            _maxTrainingImagesPerName = int.Parse(configuration["ImageProcessing:MaximumNumberOfTrainingImagesPerName"] ?? "50");
            _rescanAll = bool.Parse(configuration["ImageProcessing:RescanAllImages"] ?? "false");
            _imagesToLocalPath = configuration["ImageProcessing:FacesToLocalPath"];
            _writeImagesToLocal = bool.Parse(configuration["ImageProcessing:WriteFacesToLocal"] ?? "false") &&
                                  !string.IsNullOrEmpty(_imagesToLocalPath) && Directory.Exists(_imagesToLocalPath);
            _googleGeoCoder = bool.Parse(configuration["GoogleAPI:GeoLookupAuthorized"] ?? "false") ? new GoogleGeocoder(configuration["GoogleAPI:Key"])
                : null;
            _connectionString = connectionString;
            _configuration = configuration;
        }

        private DataContext GetNewDataContext()
        {
            var builder = new DbContextOptionsBuilder<DataContext>();
            builder.UseLoggerFactory(MyLoggerFactory);
            builder.UseSqlServer(_connectionString);
#if DEBUG
            builder.EnableSensitiveDataLogging(true);
#endif
            return new DataContext(builder.Options, _httpContextAccessor);
        }

        public IEnumerable<string> GetImages(string path)
        {
            return GetFiles(path, "*.jpg|*.jpeg|*.gif").Where(f => !f.Contains(".mp4"));
        }

        public IEnumerable<string> GetFiles(string path, string searchPattern)
        {
            var searchPatterns = searchPattern.Split('|');
            var files = new List<string>();
            foreach (string sp in searchPatterns)
                files.AddRange(Directory.GetFiles(path, sp));
            files.Sort();
            return files;
        }

        public async Task<int> SaveImagesIntoDatabase(string path)
        {

            var files = GetImages(path).ToList();
            if (!files.Any())
            {
                return 0;
            }

            return await SaveImagesIntoDatabase(path, files);
        }

        public void SaveAllFolders()
        {
            using (var context = GetNewDataContext())
            {
                var folders = Directory.GetDirectories(PhotosLocation);
                var changes = 0;
                foreach (var path in folders)
                {
                    var dbPath = GetFolderName(path);
                    var dbFolder =
                        context.FileSystemFolders.FirstOrDefault(f =>
                            f.ParentId == null && f.Path == dbPath);
                    if (dbFolder == null)
                    {
                        dbFolder = new FileSystemFolder
                        {
                            Path = dbPath,
                            ParentId = null
                        };
                        context.FileSystemFolders.Add(dbFolder);
                        changes++;
                    }

                    changes += _SaveFolders(context, path, dbFolder);
                }

                context.SaveChanges();
            }
        }

        private int _SaveFolders(DataContext context, string fullPath, FileSystemFolder fileSystemFolder)
        {
            var folders = Directory.GetDirectories(fullPath);
            var changed = 0;
            foreach (var path in folders)
            {
                var dbPath = GetFolderName(path);
                var dbFolder = context.FileSystemFolders.FirstOrDefault(f => f.Path == dbPath);
                if (dbFolder == null)
                {
                    dbFolder = new FileSystemFolder
                    {
                        Path = dbPath,
                        ParentId = fileSystemFolder.Id,
                        Parent = fileSystemFolder
                    };
                    context.FileSystemFolders.Add(dbFolder);
                    changed++;
                }
                changed += _SaveFolders(context, path, dbFolder);
            }

            return changed;
        }

        public FacialRecognition SetupFacialRecognition(DataContext context, List<Face> trainingImages = null)
        {
            if (trainingImages == null)
            {
                // ReSharper disable once PossibleInvalidOperationException
                trainingImages = context.Faces.AsNoTracking().Where(f => f.IsValid && f.TagId.HasValue).ToList().GroupBy(f => f.TagId.Value).Select(g => g.Take(_maxTrainingImagesPerName)).SelectMany(s => s).ToList();
            }
            return new FacialRecognition(_configuration, trainingImages);
        }
        public async Task<int> SaveImagesIntoDatabase(string path, List<string> files)
        {
            using (var context = GetNewDataContext())
            {
                var folderPath = GetFolderName(path);
                var folder = context.FileSystemFolders.AsNoTracking().FirstOrDefault(f => f.Path == folderPath);
                if (folder == null)
                {
                    return 0;
                }

                var thumbnails = context.Thumbnails.AsNoTracking().Where(t => t.FileSystemFolderId == folder.Id).ToList();

                var r = new Regex(":");
                var newImages = 0;
                foreach (var file in files)
                {
                    var fileName = Path.GetFileName(file);
                    var thumbNail =
                        thumbnails.FirstOrDefault(t => t.FileName.Equals(fileName, StringComparison.InvariantCultureIgnoreCase));
                    if (thumbNail != null)
                    {
                        if (!bool.Parse(_configuration["ImageProcessing:OverrideImagesOnFetch"] ?? "false"))
                        {
                            continue;
                        }
                    }

                    using (var img = Image.Load(file))
                    using (var bitmap = Resize(img))
                    {
                        var add = thumbNail == null;
                        var image = thumbNail ?? new Thumbnail
                        {
                            FileSystemFolderId = folder.Id,
                            FileName = fileName,
                            FileCreateDateTime = GetImageCreateDate(img, file, fileName),
                            Latitude = GetGpsValue(img, ExifTag.GPSLatitudeRef, ExifTag.GPSLatitude),
                            Longitude = GetGpsValue(img, ExifTag.GPSLongitudeRef, ExifTag.GPSLongitude),
                            Altitude = GetAltitude(img)
                        };
                        await SetLocation(context, image);

                        image.Bytes = ImageToByteArray(bitmap);
                        image.ImageWidth = img.Width;
                        image.ImageHeight = img.Height;
                        if (add)
                        {
                            context.Thumbnails.Add(image);
                        }
                        else
                        {
                            context.Entry(thumbNail).State = EntityState.Modified;
                        }
                    }
                    newImages++;
                }
                if (newImages > 0)
                {
                    context.SaveChanges();
                }
                return newImages;
            }
        }

        private DateTime GetImageCreateDate(Image img, string path, string fileName)
        {
            if (img.Metadata.ExifProfile.TryGetValue(ExifTag.DateTimeOriginal, out var exifValue) && exifValue.Value is byte[] createDateBytes)//.Any(x => x == Base.Constants.ExifCreateDatePropertyId))
            {
                return DateTime.Parse(new Regex(":").Replace(Encoding.UTF8.GetString(createDateBytes), "-", 2));
            }
            else
            {
                DateTime createDate;
                return DateTime.TryParse(fileName.Replace(Path.GetExtension(fileName), string.Empty),
                        out createDate)
                        ? createDate
                        : File.GetCreationTime(path);
            }
        }

        private float? GetGpsValue(Image img, ExifTag propItemRefValue, ExifTag propItemValue)
        {
            if (!(img.Metadata.ExifProfile.TryGetValue(propItemRefValue, out var propItemRef) && img.Metadata.ExifProfile.TryGetValue(propItemValue, out var propItem)))
            {
                return null;
            }
            
            var degrees = GetRationalValue(propItem, 0);
            var minutes = GetRationalValue(propItem, 1);
            var seconds = GetRationalValue(propItem, 2);

            var coordinate = degrees + (minutes / 60f) + (seconds / 3600f);
            var gpsRef = propItemRef.Value.ToString();
            if (gpsRef == "S" || gpsRef == "W")
                return 0 - coordinate;
            return coordinate;
        }

        private float? GetAltitude(Image img)
        {

            if (!(img.Metadata.ExifProfile.TryGetValue(ExifTag.GPSAltitudeRef, out var propItemRef) && img.Metadata.ExifProfile.TryGetValue(ExifTag.GPSAltitude, out var propItem)))
            {
                return null;
            }
            
            var value = GetRationalValue(propItem, 0);

            if (((byte) propItemRef.Value) == 1)// 0 (Above Sea Level) or 1 (Below Sea Level)
                return 0 - value;
            return value;
        }

        private float GetRationalValue(ExifValue propItem, int index)
        {
            if (!propItem.IsArray)
            {
                return (float) ((Rational) propItem.Value).ToDouble();
            }
            var rationals = (Rational[]) propItem.Value;
            if (index >= 0 && index < rationals.Length)
            {
                return (float) rationals[index].ToDouble();
            }
            throw new Exception($"Index out of range: {index} > {rationals.Length}");
        }
        
        private async Task SetLocation(DataContext context, Thumbnail thumbnail)
        {
            if (!thumbnail.Latitude.HasValue || !thumbnail.Longitude.HasValue || _googleGeoCoder == null ||
                thumbnail.Location != null)
            {
                return;
            }

            var knownLocation = context.Thumbnails.Include(t=> t.Location).FirstOrDefault(t =>
                (t.Latitude.Value >= thumbnail.Latitude.Value - .00002 && t.Latitude.Value <= thumbnail.Latitude.Value + .00002) &&
                (t.Longitude.Value >= thumbnail.Longitude.Value - .00002 && t.Longitude.Value <= thumbnail.Longitude.Value + .00002) &&
                thumbnail.Location != null)?.Location;
            if (knownLocation != null)
            {
                thumbnail.Location = knownLocation;
                return;
            }
            var addresses = await _googleGeoCoder.ReverseGeocodeAsync(thumbnail.Latitude.Value, thumbnail.Longitude.Value);
            var address = addresses.FirstOrDefault();
            if (address == null)
            {
                return;
            }
            var location =
                context.Locations.FirstOrDefault(l => l.PlaceId == address.PlaceId) ??
                context.Locations.Local.FirstOrDefault(l => l.PlaceId == address.PlaceId);
            if (location == null)
            {
                var streetNumber = address.Components.FirstOrDefault(c => c.Types.Any(t => t == GoogleAddressType.StreetNumber))?.LongName;
                var streetAddress= address.Components.FirstOrDefault(c => c.Types.Any(t => t == GoogleAddressType.StreetAddress || t == GoogleAddressType.Route))?.LongName;
                location = new Location
                {
                    Name = streetNumber != null && streetAddress != null ? $"{streetNumber} {streetAddress}" : address.FormattedAddress,
                    PlaceId = address.PlaceId,
                    Latitude = thumbnail.Latitude,
                    Longitude = thumbnail.Longitude
                };
                foreach (var component in address.Components.ToList())
                {
                    var types = $"|{string.Join("|", component.Types.Select(t => (int)t).OrderBy(t => t))}|";
                    var dbComponent = context.Components.FirstOrDefault(c =>
                                          c.LongName == component.LongName && c.ShortName == component.ShortName &&
                                          c.TypesString == types) ??
                                      context.Components.Local.FirstOrDefault(c =>
                                          c.LongName == component.LongName && c.ShortName == component.ShortName &&
                                          c.TypesString == types);
                    if (dbComponent == null)
                    {
                        dbComponent = new GoogleAddressComponent
                        {
                            LongName = component.LongName,
                            ShortName = component.ShortName,
                            TypesString = types
                        };
                        context.Components.Add(dbComponent);
                    }

                    var locationComponent = new LocationComponent
                    {
                        ComponentId = dbComponent.Id,
                        Component = dbComponent,
                        Location = location
                    };
                    context.LocationComponent.Add(locationComponent);
                }
                context.Locations.Add(location);
            }
            thumbnail.Location = location;
        }
        public async Task FixImageCreateDate()
        {
            using (var context = GetNewDataContext())
            {
                var thumbnails = context.Thumbnails
                    .Include(t=> t.FileSystemFolder)
                    .Include(t=> t.Location).ToList();
                var modified = 0;
                var r = new Regex(":");
                foreach (var thumbnail in thumbnails)
                {

                    var path = GetFullPath(thumbnail);

                    using (var img = Image.Load(path))
                    {
                        var fileCreateDateTime = GetImageCreateDate(img, path, thumbnail.FileName);
                        var latitude = GetGpsValue(img, ExifTag.GPSLatitudeRef, ExifTag.GPSLatitude);
                        var longitude = GetGpsValue(img, ExifTag.GPSLongitudeRef, ExifTag.GPSLongitude);
                        var altitude = GetAltitude(img);
                        if (thumbnail.FileCreateDateTime != fileCreateDateTime || thumbnail.Latitude != latitude ||
                            thumbnail.Longitude != longitude || thumbnail.Altitude != altitude ||
                            (_googleGeoCoder != null && longitude.HasValue && latitude.HasValue &&
                             thumbnail.Location == null))
                        {
                            thumbnail.Latitude = latitude;
                            thumbnail.Longitude = longitude;
                            thumbnail.Altitude = altitude;
                            thumbnail.FileCreateDateTime = fileCreateDateTime;

                            await SetLocation(context, thumbnail);

                            context.Entry(thumbnail).State = EntityState.Modified;
                            modified++;
                        }
                    }
                }
                if (modified > 0)
                {
                    context.SaveChanges();
                }
            }
        }
        public async Task<bool> AddLocationData(int max)
        {
            if (_googleGeoCoder == null)
            {
                return false;
            }

            using (var context = GetNewDataContext())
            {
                var thumbnails = context.Thumbnails.Include(t => t.Location).Where(t => t.Location == null && t.Latitude.HasValue && t.Longitude.HasValue).Take(max);
                var modified = 0;
                foreach (var thumbnail in thumbnails)
                {
                    await SetLocation(context, thumbnail);
                    if (thumbnail.Location != null)
                    {
                        context.Entry(thumbnail).State = EntityState.Modified;
                        modified++;
                    }
                }
                if (modified > 0)
                {
                    context.SaveChanges();
                }

                return thumbnails.Any();
            }
        }

        public int RetagFaces()
        {
            var numUpdated = 0;
            using (var context = GetNewDataContext())
            using (var recognizer = SetupFacialRecognition(context))
            {
                var tags = context.Tags.Where(t => t.TagTypeId == Constants.Tags.PersonTagTypeId).ToList();
                var facesToTest = context.Faces.Where(f => f.NeedsValidation && !f.IsValid).ToList();
                foreach(var face in facesToTest)
                {
                    var currentTag = face.TagId;
                    var updated = recognizer.IdentifyFace(face);
                    if(updated != null && currentTag != updated.TagId)
                    {
                        Logger.Trace($"Updated face {face.Id} from tag { tags.FirstOrDefault(t => t.Id == currentTag)?.Name} to { tags.FirstOrDefault(t => t.Id == updated.TagId)?.Name}");
                        numUpdated++;
                        context.Entry(updated).State = EntityState.Modified;
                        context.SaveChanges();
                    }
                }
            }
            return numUpdated;
        }
        public void ScanImages(int numThreads, int pageSize)
        {
            List<long> imagesToScan;
            using (var context = GetNewDataContext())
            {
                imagesToScan = context.Thumbnails.AsNoTracking().Where(t => _rescanAll || !t.Scanned).Select(t => t.Id).ToList();
            }

            var threads = new List<Task>();
            var idx = 0;
            Logger.Trace($"Starting scan with {numThreads} threads and {pageSize} per batch");
            while (idx * pageSize < imagesToScan.Count())
            {
                var images = imagesToScan.Skip(idx * pageSize).Take(pageSize).ToList();
                if (images.Any())
                {
                    var thread = Task.Factory.StartNew(() =>
                    {
                        Thread.CurrentThread.IsBackground = true;
                        try
                        {
                            Logger.Trace($"Scanning images { images.First()} through {images.Last()}");
                            var numNewFaces = _ScanImages(images);
                            Logger.Trace($"{numNewFaces} new faces.");
                        }
                        catch (Exception ex)
                        {
                            Logger.Error(ex, $"Failed to scan images, {ex.Message}: {ex}");
                        }
                    });
                    threads.Add(thread);
                    if (threads.Count > numThreads)
                    {
                        Task.WaitAll(threads.ToArray());
                        threads.Clear();
                    }

                    idx++;
                }
                else
                {
                    break;
                }
            }
            Task.WaitAll(threads.ToArray());
        }

        public int ScanImages(List<long> imagesToScan)
        {
            return _ScanImages(imagesToScan);
        }

        private int _ScanImages(List<long> imagesToScan)
        {
            var numNewFaces = 0;
            using (var context = GetNewDataContext())
            using (var recognizer = SetupFacialRecognition(context))
            {
                foreach (var id in imagesToScan)
                {
                    var thumbnail = context.Thumbnails
                        .Include(t => t.FileSystemFolder)
                        .Include(t => t.Faces)
                        .Include(t => t.TagThumbnails)
                            .ThenInclude(tt => tt.Tag)
                            .ThenInclude(tag => tag.TagType)
                        .First(t => t.Id == id);
                    thumbnail.Scanned = true;
                    context.Entry(thumbnail).State = EntityState.Modified;

                    using (var img = Image.Load(GetFullPath(thumbnail)))
                    {
                        ExifRotate(img);
                        using (var imageStream = new MemoryStream())
                        {
                            img.SaveAsBmp(imageStream);


                            Logger.Trace($"Scanning image {thumbnail.FileName} for faces");
                            foreach (var unknown in thumbnail.Faces
                                .Where(f => f.TagId == Base.Constants.Tags.UnknownTagId && !f.IsValid && f.NeedsValidation).ToList())
                            {
                                //re-evaluate non-validated faces
                                double dist;
                                var tagId = recognizer.Recognize(unknown.Bytes, out dist);
                                if (tagId.HasValue && tagId.Value != Base.Constants.Tags.UnknownTagId &&
                                    dist <= _minDistanceForFacialRecognition)
                                {
                                    unknown.TagId = tagId.Value;
                                    unknown.Distance = dist;
                                }
                            }

                            var foundRectangles = thumbnail.Faces.Select(f => f.Rectangle)
                                .ToList();
                            var faces = recognizer.Recognize(foundRectangles, imageStream);
                            var sideFaces = recognizer.Recognize(foundRectangles, imageStream,
                                FacialRecognition.HaarCascadeSideProfile);

                            using (var flippedStream = new MemoryStream())
                            {
                                img.Mutate(x => x.RotateFlip(RotateMode.None, FlipMode.Horizontal));
                                img.SaveAsBmp(flippedStream);

                                var flipped = foundRectangles.Select(k =>
                                    new System.Drawing.Rectangle(k.X + k.Width + thumbnail.ImageWidth, k.Y, k.Width, k.Height)).ToList();
                                var leftSideFaces = recognizer.Recognize(flipped, flippedStream, FacialRecognition.HaarCascadeSideProfile);
                                foreach (var face in leftSideFaces)
                                {
                                    //need to flip the images back.
                                    face.RectX = thumbnail.ImageWidth - face.RectWidth - face.RectX;
                                }
                                Logger.Trace($"Found {leftSideFaces.Count} flipped faces. {sideFaces.Count}");

                                faces.AddRange(sideFaces);
                                faces.AddRange(leftSideFaces);
                            }

                            var filtered = new List<Face>();
                            foreach (var face in faces)
                            {
                                if ((face.Distance <= _minDistanceForFacialRecognition || face.RectWidth > _minWidthForOverride || face.RectHeight > _minHeightForOverride) && !filtered.Any(f =>
                                        f.Rectangle.Contains(face.Rectangle) || face.Rectangle.Contains(f.Rectangle) ||
                                        Overlaps(f.Rectangle, face.Rectangle, 70)))
                                {
                                    if (face.Distance <= _minDistanceForFacialRecognition)
                                    {
                                        face.TagId = Base.Constants.Tags.UnknownTagId;
                                    }
                                    filtered.Add(face);
                                }
                                else if (_writeImagesToLocal)
                                {

                                    var filePath = Path.Combine(_imagesToLocalPath, "Skipped");
                                    if (!Directory.Exists(filePath))
                                    {
                                        Directory.CreateDirectory(filePath);
                                    }

                                    using (var tmp = Image.Load(new MemoryStream(face.Bytes)))
                                    {
                                        tmp.Save(Path.Combine(filePath, $"{(int)face.Distance}_{face.TagId}_{face.RectWidth}_{face.RectHeight}_{Guid.NewGuid():N}.jpg"));
                                    }
                                }
                            }

                            var groups = filtered.GroupBy(f =>
                                !thumbnail.Faces.Any(i =>
                                    f.Rectangle.Contains(i.Rectangle) ||
                                    i.Rectangle.Contains(f.Rectangle) ||
                                    (i.Rectangle.IntersectsWith(f.Rectangle) &&
                                     (i.TagId == f.TagId || Overlaps(i.Rectangle, f.Rectangle, 70)))
                                )).ToList();
                            var newFaces = groups.Where(g => g.Key).SelectMany(v => v).ToList();
                            var oldFaces = groups.Where(g => !g.Key).SelectMany(v => v).Where(f => f.TagId != Base.Constants.Tags.UnknownTagId).ToList();

                            Logger.Trace($"Updating the old faces for {thumbnail.FileName}");
                            foreach (var face in thumbnail.Faces.Where(i => i.TagId == Base.Constants.Tags.UnknownTagId && !i.IsValid && i.NeedsValidation))
                            {
                                var matches = oldFaces.Where(f =>
                                    f.Rectangle.Contains(face.Rectangle) || face.Rectangle.Contains(f.Rectangle) ||
                                    (face.Rectangle.IntersectsWith(f.Rectangle) &&
                                     Overlaps(face.Rectangle, f.Rectangle, 70))).ToList();
                                if (matches.Any() && matches.Select(m => m.TagId).Distinct().Count() == 1)
                                {
                                    face.TagId = matches.First().TagId;
                                    face.Distance = matches.First().Distance;
                                    context.Entry(face).State = EntityState.Modified;
                                }
                            }

                            Logger.Trace($"Adding new faces for {thumbnail.FileName}");
                            foreach (var face in newFaces)
                            {
                                numNewFaces++;
                                face.Thumbnail = thumbnail;
                                face.ThumbnailId = thumbnail.Id;

                                if (_writeImagesToLocal)
                                {

                                    var filePath = Path.Combine(_imagesToLocalPath, "Added");
                                    if (!Directory.Exists(filePath))
                                    {
                                        Directory.CreateDirectory(filePath);
                                    }

                                    using (var tmp = Image.Load(new MemoryStream(face.Bytes)))
                                    {
                                        tmp.Save(Path.Combine(filePath, $"{face.TagId}_{Guid.NewGuid():N}.jpg"));
                                    }
                                }
                                thumbnail.Faces.Add(face);
                                context.Faces.Add(face);
                            }
                            Logger.Trace($"Updating the people tags for {thumbnail.FileName}");
                            var tagIds = thumbnail.Faces.Where(f => f.TagId.HasValue && f.TagId != Base.Constants.Tags.UnknownTagId && !f.IsHidden).Select(f => f.TagId.Value).Distinct().ToList();
                            foreach (var tagId in tagIds)
                            {
                                if (!context.TagThumbnails.Any(tt => tt.ThumbnailId == thumbnail.Id && tt.TagId == tagId && tt.Tag.TagTypeId == Constants.Tags.PersonTagTypeId))
                                {
                                    var tag = context.Tags.FirstOrDefault(t =>
                                        t.Id == tagId && t.TagTypeId == Constants.Tags.PersonTagTypeId);
                                    if (tag != null)
                                    {
                                        var tagThumbnail = new TagThumbnail { Tag = tag, TagId = tag.Id, Thumbnail = thumbnail, ThumbnailId = thumbnail.Id };
                                        thumbnail.TagThumbnails.Add(tagThumbnail);
                                    }
                                    else
                                    {
                                        Logger.Error($"Tag id not found {tagId}.");
                                    }
                                }
                            }

                        }
                        Logger.Trace($"{thumbnail.FileName} complete");
                    }
                }

                context.SaveChanges();
            }

            return numNewFaces;
        }
        public bool Overlaps(System.Drawing.Rectangle rect1, System.Drawing.Rectangle rect2, int minPercent)
        {
            var xOverlap = Math.Max(0, Math.Min(rect1.X + rect1.Width, rect2.X + rect2.Width) - Math.Max(rect1.X, rect2.X));
            var yOverlap = Math.Max(0, Math.Min(rect1.Y + rect1.Height, rect2.Y + rect2.Height) - Math.Max(rect1.Y, rect2.Y));
            var overlapArea = (double)xOverlap * yOverlap;
            return (overlapArea / Math.Min(rect1.Width * rect1.Height, rect2.Width * rect2.Height) * 100) >
                           minPercent;
        }

        public string GetFullPath(Thumbnail thumbnail)
        {
            var fileSystemFolderPath = thumbnail.FileSystemFolder?.Path;
            if (thumbnail.FileSystemFolder == null && thumbnail.FileSystemFolderId > 0)
            {
                //incase the caller didn't include the file system folder in the database call.
                using (var context = GetNewDataContext())
                {
                    fileSystemFolderPath = context.FileSystemFolders
                        .FirstOrDefault(f => f.Id == thumbnail.FileSystemFolderId)?.Path;

                }
            }
            return Path.Combine(PhotosLocation, fileSystemFolderPath, thumbnail.FileName);
        }
        public string GetFolderName(string fileName)
        {
            var name = fileName.Replace(PhotosLocation, string.Empty);
            if (name.EndsWith("\\"))
            {
                name = name.Substring(0, name.Length - 1);
            }
            return name.Trim();
        }
        public string GetId(string file)
        {
            return WebUtility.UrlEncode(file.Replace(PhotosLocation, string.Empty));
        }
        public string GetFileId(string file)
        {
            return GetId(file).Replace(".", "|");
        }

        public Image Resize(string fileName)
        {
            using (var image = Image.Load(fileName))
            {
                return Resize(image);
            }
        }

        public Image Resize(Image image)
        {
            image.Mutate(x=> x.AutoOrient());
            var width = Base.Constants.ThumbnailResizedWidth;
            var height = (int)(width * ((float)image.Height / image.Width));
            return image.Clone(context => context
                .Resize(new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new SixLabors.Primitives.Size(width, height)
                }));
        }
        
        public void ExifRotate(Image img)
        {
            img.Mutate(x => x.AutoOrient());
        }
        public byte[] ImageToByteArray(Image imageIn)
        {
            using (var ms = new MemoryStream())
            {
                imageIn.Save(ms, new JpegEncoder { Quality = 100 });
                return ms.ToArray();
            }
        }
    }
}
