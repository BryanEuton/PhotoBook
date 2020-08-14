using PhotoBook.Common;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using NLog;

namespace PhotoBook.ImageFetcher
{
    public class FetchPhotos
    {
        /// <summary>
        /// A local logger for the class.
        /// </summary>
        public Logger Logger = LogManager.GetCurrentClassLogger();

        private readonly IConfiguration _configuration;
        private readonly string _photosLocation;
        public FetchPhotos(IConfiguration configuration)
        {
            _configuration = configuration;
            _photosLocation = _configuration["ImageProcessing:PhotosLocation"];
            Helpers = new Helpers(_photosLocation, _configuration, null, _configuration["ConnectionStrings:PhotoBookConnection"]);
        }
        private Helpers Helpers { get; set; }
        
        public async Task Fetch()
        {
            Logger.Trace("Fetching all photos");
            var start = DateTime.Now;
            
            Helpers.SaveAllFolders();
            var threads = new List<Task>();
            foreach (var folder in Directory.GetDirectories(_photosLocation))
            {
                var thread = Task.Factory.StartNew(async () =>
                {
                    Thread.CurrentThread.IsBackground = true;
                    try
                    {
                        await _Fetch(folder);
                    }
                    catch (Exception ex)
                    {
                        Logger.Error(ex, $"Failed to fetch folder {folder}, {ex.Message}: {ex}");
                    }
                });
                threads.Add(thread);
            }
            Task.WaitAll(threads.ToArray());
            await _SaveImages(_photosLocation);
            Logger.Trace($"Fetching all photos complete {(DateTime.Now - start).TotalMinutes }");
        }

        public async Task FixFileCreateDate()
        {
            Logger.Trace("Fixing Create Dates");
            var start = DateTime.Now;
            await Helpers.FixImageCreateDate();
            Logger.Trace($"Fixing Create Dates complete {(DateTime.Now - start).TotalMinutes }");
        }

        public async Task FetchLocationsViaBatch()
        {
            Logger.Trace("Fetch Locations via batch");
            var start = DateTime.Now;
            var batchSize = int.Parse(_configuration["ImageProcessing:FetchLocationsBatchSize"] ?? "50");
            var max = int.Parse(_configuration["ImageProcessing:FetchLocationsMaxIterations"] ?? "2");
            var sleepTime = int.Parse(_configuration["ImageProcessing:FetchLocationsSleepSeconds"] ?? "1") * 1000;
            for (var idx = 0; idx < max; idx++)
            {
                var success = await Helpers.AddLocationData(batchSize);
                if (!success)
                {
                    break;
                }
                Thread.Sleep(sleepTime);
            }
            Logger.Trace($"Fetch Locations via batch complete {(DateTime.Now - start).TotalMinutes }");
        }
        public void ReTagFaces()
        {
            Logger.Trace("ReTagFaces started");
            var start = DateTime.Now;
            var numUpdated = Helpers.RetagFaces();
            Logger.Trace($"ReTagFaces complete {(DateTime.Now - start).TotalMinutes }.  Retagged {numUpdated} faces.");
        }
        public void ScanPhotos()
        {
            Logger.Trace("Scanning Photos");
            var start = DateTime.Now;
            var numThreads = int.Parse(_configuration["ImageProcessing:NumThreads"] ?? "3");
            var pageSize = int.Parse(_configuration["ImageProcessing:PageSize"] ?? "10");
            Helpers.ScanImages(numThreads, pageSize);
            Logger.Trace($"Scanning Photos complete {(DateTime.Now - start).TotalMinutes }");
        }
        private async Task _Fetch(string dir)
        {
            await _SaveImages(dir);
            foreach (var folder in Directory.GetDirectories(dir))
            {
                await _Fetch(folder);
            }
        }
        private async Task _SaveImages(string dir)
        {
            await Helpers.SaveImagesIntoDatabase(dir);
        }
    }
}
