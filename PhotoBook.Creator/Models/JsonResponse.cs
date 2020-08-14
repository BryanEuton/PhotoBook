using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace PhotoBook.Creator.Models
{
    public class JsonResponse<T>
    {
        public JsonResponse(bool success, T results, string undoUrl, T undoArgs, string message = null)
        {
            Success = success;
            Results = results;
            Message = message;
            Undo = new UndoResponse<T>
            {
                Url =  undoUrl,
                Args = undoArgs
            };
        }
        [JsonProperty("message")]
        public string Message { get; set; }
        [JsonProperty("success")]
        public bool Success { get; set; }
        [JsonProperty("results")]
        public T Results { get; set; }
        [JsonProperty("undo")]
        public UndoResponse<T> Undo { get; set; }
    }
}