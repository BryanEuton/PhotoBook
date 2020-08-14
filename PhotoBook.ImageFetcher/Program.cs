using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using NLog;

namespace PhotoBook.ImageFetcher
{
    class Program
    {
        static void Main(string[] args)
        {
            var logger = LogManager.GetCurrentClassLogger();
            var start = DateTime.Now;
            try
            {
                logger.Trace("Fetch Images started");
                
                var builder = new ConfigurationBuilder()
                    .SetBasePath(AppContext.BaseDirectory)
                    .AddJsonFile("appsettings.json")
                    .AddEnvironmentVariables();

                var configuration = builder.Build();

                var fetcher = new FetchPhotos(configuration);
                var tasks = new List<Task>();
                if (args?.Any() == true)
                {
                    var taskName = args[0];
                    if(taskName == "fix-locations")
                    {
                        tasks.Add(fetcher.FetchLocationsViaBatch());
                    }else if (taskName == "retag-faces")
                    {
                        //This task will retag any faces that still need validation
                        fetcher.ReTagFaces();
                    }
                    else if (taskName == "fetch")
                    {
                        tasks.Add(fetcher.Fetch());
                    }
                    else if (taskName == "fix-dates")
                    {
                        tasks.Add(fetcher.FixFileCreateDate());
                    }
                    else
                    {
                        logger.Trace("Unknown task specified.");
                    }
                    Task.WaitAll(tasks.ToArray());
                }
                else
                {
                    tasks.Add(fetcher.FixFileCreateDate());
                    tasks.Add(fetcher.Fetch());
                    Task.WaitAll(tasks.ToArray());
                    fetcher.ScanPhotos();
                }
            }
            catch (Exception ex)
            {
                LogManager.GetCurrentClassLogger().Error(ex, $"Error fetching photos{ex.Message}: {ex}");
            }
            finally
            {
                logger.Trace($"Fetch Images completed in {(DateTime.Now - start).TotalMilliseconds} ms");
            }
        }
    }
}
