using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace PhotoBook.Creator.Models
{
    public class PagedResultsWithOrder<T> : PagedResults<T>
    {
        public PagedResultsWithOrder(T results, List<long> resultsOrder, int totalResults, string message = null) : base(results, totalResults, message)
        {
            ResultsOrder = resultsOrder;
        }

        [JsonProperty("resultsOrder")]
        public List<long> ResultsOrder { get; set; }
    }
}