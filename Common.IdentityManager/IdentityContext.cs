using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NLog;
using Common.IdentityManager.Models;
using IdentityServer4.EntityFramework.Options;
using Microsoft.AspNetCore.ApiAuthorization.IdentityServer;
using Microsoft.Extensions.Options;

namespace Common.IdentityManager
{
    public class IdentityContext : ApiAuthorizationDbContext<ApplicationUser>
    {
        /// <summary>
        /// A local logger for the class.
        /// </summary>
        public Logger Logger = LogManager.GetCurrentClassLogger();

        public IdentityContext(DbContextOptions options,
            IOptions<OperationalStoreOptions> operationalStoreOptions) : base(options, operationalStoreOptions)
        {
        }

        public DbSet<ApplicationUser> ApplicationUsers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            Logger.Trace("Creating Identity Model");
            base.OnModelCreating(modelBuilder);
        }

    }
}