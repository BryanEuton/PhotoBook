using Microsoft.AspNetCore.Mvc;
using System.Linq;
using Microsoft.Extensions.Logging;
using PhotoBook.DataManager;
using Microsoft.AspNetCore.Authorization;
using PhotoBook.Creator.Models;
using System.Collections.Generic;
using System;
using PhotoBook.DataManager.Models;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PhotoBook.Base;
using PhotoBook.Creator.Filters;
using PhotoBook.Creator.Models.Posts;

namespace PhotoBook.Creator.Controllers
{
    public class SearchController : BaseController
    {
        public SearchController(IConfiguration iConfiguration, DataContext context) : base(iConfiguration, context)
        {}

        [HttpPost]
        [Route("api/Search/PagedSearchResults")]
        [AjaxErrorHandler]
        public PagedResults<List<ImageDto>> PagedSearchResults(PostSearchRequest postSearchRequest)
        {
            if(postSearchRequest == null)
            {
                return null;
            }
            

            if (postSearchRequest.Page <= 0)
            {
                postSearchRequest.Page = 1;
            }

            var noTags = postSearchRequest.Tags.Any(id => id == -1);
            var tags = postSearchRequest.Tags.Where(id => id != -1).ToList();
            var query = Context.Thumbnails
                            .Include(t => t.Comments)
                            .Include(t=> t.PhotoBooks)
                            .Include(t=> t.Faces)
                                .ThenInclude(tt => tt.Tag)
                            .Include(t => t.TagThumbnails)
                                .ThenInclude(tt=> tt.Tag)
                                    .ThenInclude(tag => tag.TagType)
                            .Where(t =>
                t.FileCreateDateTime >= postSearchRequest.Start &&
                (postSearchRequest.End == null || t.FileCreateDateTime <= postSearchRequest.End.Value) &&
                t.Hide == postSearchRequest.ShowHidden &&
                (postSearchRequest.Tags.Count == 0 || (noTags && !t.TagThumbnails.Any()) || (!noTags && t.TagThumbnails.Any(tt => tags.Contains(tt.Tag.Id)))) &&
                ((postSearchRequest.States.Count == 0 && postSearchRequest.Cities.Count == 0) || (t.Location.LocationComponents.Any(c => 
                        (c.Component.TypesString.Contains(((int)GoogleAddressType.AdministrativeAreaLevel1).ToString()) &&
                        postSearchRequest.States.Any(s => s == c.Component.LongName)) ||
                        (c.Component.TypesString.Contains(((int)GoogleAddressType.Locality).ToString()) &&
                        postSearchRequest.Cities.Any(s => s == c.Component.LongName))
                    ))) &&
                (postSearchRequest.Locations.Count == 0 || postSearchRequest.Locations.Any(l => l == t.LocationId.Value))
            );
            IOrderedQueryable<Thumbnail> orderedQuery = null;
            if (!postSearchRequest.OrderDetails.Any())
            {
                postSearchRequest.OrderDetails.Add(new OrderByDto
                {
                    Name = "Date",
                    Asc = false
                });
            }
            foreach (var orderBy in postSearchRequest.OrderDetails)
            {
                switch (orderBy.Name.ToLower())
                {
                    case ("date"):
                        {
                            orderedQuery = AddOrder(query, orderedQuery, orderBy.Asc, o => o.FileCreateDateTime);
                            break;
                        }
                    case ("tags"):
                        {
                            orderedQuery = AddOrder(query, orderedQuery, orderBy.Asc,
                                o => !o.TagThumbnails.Any(tag => orderBy.Tags.Contains(tag.TagId)));
                            break;
                        }
                    case ("num tags"):
                        {
                            orderedQuery = AddOrder(query, orderedQuery, orderBy.Asc, o => o.TagThumbnails.Count());
                            break;
                        }
                    case ("place id"):
                        {
                            orderedQuery = AddOrder(query, orderedQuery, orderBy.Asc, o => o.Location.PlaceId);
                            break;
                        }
                    case ("address"):
                        {
                            orderedQuery = AddOrder(query, orderedQuery, orderBy.Asc,
                                o => o.Location.LocationComponents.FirstOrDefault(c =>
                                                c.Component.TypesString.Contains(((int)GoogleAddressType.StreetNumber).ToString())).Component
                                            .LongName + o.Location.LocationComponents.FirstOrDefault(c =>
                                            c.Component.TypesString.Contains(((int)GoogleAddressType.StreetAddress).ToString()) ||
                                            c.Component.TypesString.Contains(((int)GoogleAddressType.Route).ToString())).Component.LongName);
                            break;
                        }
                    case ("city"):
                        {
                            orderedQuery = AddOrder(query, orderedQuery, orderBy.Asc,
                                o => o.Location.LocationComponents.FirstOrDefault(c => c.Component.TypesString.Contains(((int)GoogleAddressType.Locality).ToString())).Component.LongName);
                            break;
                        }
                    case ("state"):
                        {
                            orderedQuery = AddOrder(query, orderedQuery, orderBy.Asc,
                                o => o.Location.LocationComponents.FirstOrDefault(c => c.Component.TypesString.Contains(((int)GoogleAddressType.AdministrativeAreaLevel1).ToString())).Component.LongName);
                            break;
                        }
                    case ("new faces"):
                        {
                            if (orderBy.Asc)
                            {
                                orderedQuery = AddOrder(query, orderedQuery, orderBy.Asc,
                                    o => o.Faces.Where(f => !f.IsValid && !f.NeedsValidation)
                                        .OrderBy(f => f.Created).FirstOrDefault().Created);

                            }
                            else
                            {

                                orderedQuery = AddOrder(query, orderedQuery, orderBy.Asc,
                                    o => o.Faces.Where(f => !f.IsValid && !f.NeedsValidation)
                                        .OrderByDescending(f => f.Created).FirstOrDefault().Created);
                            }

                            break;
                        }
                }
            }

            if (orderedQuery != null)
            {
                query = orderedQuery;
            }

            var photos = query
                .Skip(postSearchRequest.PageSize * (postSearchRequest.Page - 1))
                .Take(postSearchRequest.PageSize)
                .ToList()
                .Select(s => s.ToImageDto()).ToList();

            var totalResults = query.Count();
            if (postSearchRequest.OutOfOrder)
            {
                var order = query.Take(postSearchRequest.PageSize * postSearchRequest.Page)
                    .Select(i => i.Id)
                    .ToList();
                return new PagedResultsWithOrder<List<ImageDto>>(photos, order, totalResults);
            }
            return new PagedResults<List<ImageDto>>(photos, totalResults);
        }

        private IOrderedQueryable<TSource> AddOrder<TSource, TKey>(IQueryable<TSource> query, IOrderedQueryable<TSource> orderedQuery, bool asc, Expression<Func<TSource, TKey>> orderExpression)
        {
            if (asc)
            {
                orderedQuery = orderedQuery == null ? query.OrderBy(orderExpression) : orderedQuery.ThenBy(orderExpression);
            }
            else
            {
                orderedQuery = orderedQuery == null ? query.OrderByDescending(orderExpression) : orderedQuery.ThenByDescending(orderExpression);
            }

            return orderedQuery;
        }
    }
}
