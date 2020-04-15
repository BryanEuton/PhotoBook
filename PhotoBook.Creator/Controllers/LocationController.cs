using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoBook.Creator.Models;
using PhotoBook.DataManager;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using PhotoBook.Creator.Filters;
using PhotoBook.Creator.Models.Posts;
using PhotoBook.DataManager.Models;

namespace PhotoBook.Creator.Controllers
{
    public class LocationController : BaseController
    {
        public LocationController(IConfiguration iConfiguration, DataContext context) : base(iConfiguration, context)
        {}

        [HttpGet]
        [Route("api/Location/Get")]
        [AjaxErrorHandler]
        public IEnumerable<LocationDto> Get()
        {
            return Context.Locations.Select(location => new LocationDto
            {
                Id = location.Id,
                Name = location.Name,
                PlaceId = location.PlaceId,
                Latitude = location.Latitude,
                Longitude = location.Longitude,
                StreetNumber = location.LocationComponents.FirstOrDefault(lc => lc.Component.TypesString.Contains($"|{ (int)GoogleAddressType.StreetNumber}|")).Component.LongName,
                StreetAddress = location.LocationComponents.FirstOrDefault(lc => lc.Component.TypesString.Contains($"|{ (int)GoogleAddressType.StreetAddress}|") || lc.Component.TypesString.Contains($"|{ (int)GoogleAddressType.Route}|")).Component.LongName,
                Neighborhood = location.LocationComponents.FirstOrDefault(lc => lc.Component.TypesString.Contains($"|{ (int)GoogleAddressType.Neighborhood}|")).Component.LongName,
                City = location.LocationComponents.FirstOrDefault(lc => lc.Component.TypesString.Contains($"|{ (int)GoogleAddressType.Locality}|")).Component.LongName,
                State = location.LocationComponents.FirstOrDefault(lc => lc.Component.TypesString.Contains($"|{ (int)GoogleAddressType.AdministrativeAreaLevel1}|")).Component.LongName,
                County = location.LocationComponents.FirstOrDefault(lc => lc.Component.TypesString.Contains($"|{ (int)GoogleAddressType.AdministrativeAreaLevel2}|")).Component.LongName,
                PostalCode = location.LocationComponents.FirstOrDefault(lc => lc.Component.TypesString.Contains($"|{ (int)GoogleAddressType.PostalCode}|")).Component.LongName,
                Country = location.LocationComponents.FirstOrDefault(lc => lc.Component.TypesString.Contains($"|{ (int)GoogleAddressType.Country}|")).Component.LongName
            }).ToList();
        }

        [HttpGet]
        [Route("api/Location/GetStates")]
        [AjaxErrorHandler]
        public IEnumerable<string> GetStates()
        {
            return Context.Components.Where(c=> c.TypesString.Contains($"|{ (int)GoogleAddressType.AdministrativeAreaLevel1}|"))
                    .Select(c => c.LongName)
                    .Distinct()
                    .ToList();
        }

        [HttpGet]
        [Route("api/Location/GetCities")]
        [AjaxErrorHandler]
        public IEnumerable<CityDto> GetCities()
        {
            return Context.Locations.Select(l=> new CityDto
            {
                Name = l.LocationComponents.FirstOrDefault(lc=> lc.Component.TypesString.Contains($"|{ (int)GoogleAddressType.Locality}|")).Component.LongName,
                State = l.LocationComponents.FirstOrDefault(lc => lc.Component.TypesString.Contains($"|{ (int)GoogleAddressType.AdministrativeAreaLevel1}|")).Component.LongName
            }).ToList().Where(c=> !string.IsNullOrWhiteSpace(c.Name) && !string.IsNullOrWhiteSpace(c.State))
                .Distinct(new CityEqualityComparer())
                .ToList();
        }

        [HttpGet]
        [Route("api/Location/GetMapsInfo")]
        [AjaxErrorHandler]
        public GoogleMapsSettings GetMapsInfo()
        {
            decimal.TryParse(Configuration["GoogleApi:DefaultLatitude"], out var defaultLatitude);
            decimal.TryParse(Configuration["GoogleApi:DefaultLongitude"], out var defaultLongitude);
            decimal.TryParse(Configuration["GoogleApi:DefaultZoom"], out var defaultZoom);
            return new GoogleMapsSettings
            {
                ApiKey = Configuration["GoogleApi:Key"],
                DefaultLatitude = defaultLatitude,
                DefaultLongitude = defaultLongitude,
                DefaultZoom = defaultZoom,
            };
        }

        [HttpPost]
        [Route("api/Location/TogglePhoto")]
        [AjaxErrorHandler]
        public ContentResult TogglePhoto(long locationId, long thumbnailId)
        {
            try
            {
                var thumbnail = Context.Thumbnails.Include(t=> t.Location).FirstOrDefault(t => t.Id == thumbnailId);
                if (thumbnail == null)
                {
                    return AjaxFailedResult("Image not found.");
                }

                if (locationId <= 0 || thumbnail.LocationId == locationId)
                {
                    thumbnail.Location = null;
                    if (!thumbnail.LatLongFromImage && (thumbnail.Latitude.HasValue || thumbnail.Longitude.HasValue))
                    {
                        thumbnail.Latitude = null;
                        thumbnail.Longitude = null;
                    }
                    Context.Entry(thumbnail).State = EntityState.Modified;
                    Context.SaveChanges();
                    return AjaxResult<bool>(false, $"Removed location from { thumbnail.FileName }");
                }
                var location = Context.Locations.Include(l=> l.LocationComponents).ThenInclude(lc=> lc.Component).FirstOrDefault(l => l.Id == locationId);
                if (location == null)
                {
                    return AjaxFailedResult("Location not found.");
                }

                thumbnail.Location = location;
                if (!thumbnail.LatLongFromImage)
                {
                    thumbnail.Latitude = location.Latitude;
                    thumbnail.Longitude = location.Longitude;
                }

                Context.Entry(thumbnail).State = EntityState.Modified;
                Context.SaveChanges();
                return AjaxResult<bool>(true, $"Set location for { thumbnail.FileName } to { location.ToLocationDto().Formatted }");

            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to set location for {thumbnailId} to {locationId}. {ex.Message}: {ex}");
                return AjaxFailedResult($"Failed to set location for {thumbnailId} to {locationId} : {ex.Message}");
            }
        }
        
        [HttpPost]
        [Route("api/Location/SetLocation")]
        [AjaxErrorHandler]
        public ContentResult SetLocation(PostNewLocationRequest postNewLocationRequest)
        {
            try
            {
                var thumbnail = Context.Thumbnails.Include(t => t.Location).FirstOrDefault(t => t.Id == postNewLocationRequest.ThumbnailId);
                if (thumbnail == null)
                {
                    return AjaxFailedResult("Image not found.");
                }

                var location = Context.Locations.Include(l => l.LocationComponents).ThenInclude(lc => lc.Component).FirstOrDefault(l => l.PlaceId == postNewLocationRequest.PlaceId);
                if (string.Equals(postNewLocationRequest.PlaceId, location?.PlaceId, StringComparison.CurrentCultureIgnoreCase))
                {
                    return AjaxResult(location.ToLocationDto(), $"Set location for { thumbnail.FileName } to { location.ToLocationDto().Formatted }");
                }

                if (location == null)
                {
                    location = new Location
                    {
                        Name = postNewLocationRequest.Name,
                        PlaceId = postNewLocationRequest.PlaceId,
                        Latitude = postNewLocationRequest.Lat,
                        Longitude = postNewLocationRequest.Lng
                    };

                    foreach (var component in postNewLocationRequest.Components)
                    {
                        var types = $"|{string.Join("|", component.types.Select(t => (int)ConvertJsGoogleAddressType(t)).OrderBy(t => t))}|";
                        var dbComponent = Context.Components.FirstOrDefault(c =>
                                              c.LongName == component.LongName && c.ShortName == component.ShortName &&
                                              c.TypesString == types) ??
                                          Context.Components.Local.FirstOrDefault(c =>
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
                            Context.Components.Add(dbComponent);
                        }
                        var lc = new LocationComponent
                        {
                            Component = dbComponent,
                            ComponentId = dbComponent.Id,
                            Location = location,
                            LocationId = location.Id
                        };
                        Context.LocationComponent.Add(lc);
                    }
                    Context.Locations.Add(location);
                }
                else if(!location.Latitude.HasValue || !location.Longitude.HasValue)
                {
                    location.Latitude = postNewLocationRequest.Lat;
                    location.Longitude = postNewLocationRequest.Lng;
                }

                thumbnail.Location = location;
                if (!thumbnail.LatLongFromImage)
                {
                    thumbnail.Latitude = location.Latitude;
                    thumbnail.Longitude = location.Longitude;
                }
                Context.Entry(thumbnail).State = EntityState.Modified;
                Context.SaveChanges();
                return AjaxResult(location.ToLocationDto(), $"Set location for { thumbnail.FileName } to { location.ToLocationDto().Formatted }");

            }
            catch (Exception ex)
            {
                Logger.Error(ex, $"Failed to set location for {postNewLocationRequest.ThumbnailId} to {postNewLocationRequest.PlaceId}. {ex.Message}: {ex}");
                return AjaxFailedResult($"Failed to set location for {postNewLocationRequest.ThumbnailId} to {postNewLocationRequest.PlaceId} : {ex.Message}");
            }
        }
        private GoogleAddressType ConvertJsGoogleAddressType(string type)
        {
            GoogleAddressType googleAddressType;
            if (Enum.TryParse(type.Replace("_", string.Empty), true, out googleAddressType))
            {
                if (Enum.IsDefined(typeof(GoogleAddressType), googleAddressType) | googleAddressType.ToString().Contains(","))
                {
                    return googleAddressType;
                }
            }
            return GoogleAddressType.Unknown;
        }
    }
}
