using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NLog;
using PhotoBook.Base;
using PhotoBook.DataManager.Models;


namespace PhotoBook.DataManager
{
    public class DataContext : DbContext
    {
        /// <summary>
        /// A local logger for the class.
        /// </summary>
        public Logger Logger = LogManager.GetCurrentClassLogger();
        private readonly IHttpContextAccessor _httpContextAccessor;
        public DataContext(DbContextOptions<DataContext> options, IHttpContextAccessor httpContextAccessor)
            : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
            Database.SetCommandTimeout((int)TimeSpan.FromMinutes(5).TotalSeconds);
        }

        public DbSet<Models.PhotoBook> PhotoBooks { get; set; }
        public DbSet<PhotoItem> PhotoItems { get; set; }
        public DbSet<Thumbnail> Thumbnails { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<TagThumbnail> TagThumbnails { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<TagType> TagTypes { get; set; }
        public DbSet<Face> Faces { get; set; }
        public DbSet<FileSystemFolder> FileSystemFolders { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<LocationComponent> LocationComponent { get; set; }
        public DbSet<GoogleAddressComponent> Components { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // The Users/Devices many-to-many
            // Primary keys
            modelBuilder.Entity<Models.PhotoBook>().HasKey(p => p.Id);
            modelBuilder.Entity<Thumbnail>().HasKey(p => p.Id);

            modelBuilder.Entity<PhotoItem>().HasKey(q =>
                new
                {
                    q.ThumbnailId,
                    q.PhotoBookId
                });

            // Relationships
            modelBuilder.Entity<PhotoItem>()
                .HasOne(t => t.Thumbnail)
                .WithMany(t => t.PhotoBooks)
                .HasForeignKey(t => t.ThumbnailId);

            modelBuilder.Entity<PhotoItem>()
                .HasOne(t => t.PhotoBook)
                .WithMany(t => t.Photos)
                .HasForeignKey(t => t.PhotoBookId);

            modelBuilder.Entity<PhotoItem>()
                .HasIndex(b => new { b.ThumbnailId, b.PhotoBookId })
                .IsUnique();

            modelBuilder.Entity<LocationComponent>()
                .HasKey(lc => new { lc.LocationId, lc.ComponentId });

            modelBuilder.Entity<LocationComponent>()
                .HasOne(lc => lc.Location)
                .WithMany(l => l.LocationComponents)
                .HasForeignKey(lc => lc.LocationId);

            modelBuilder.Entity<LocationComponent>()
                .HasOne(lc => lc.Component)
                .WithMany(c => c.LocationComponents)
                .HasForeignKey(lc => lc.ComponentId);

            modelBuilder.Entity<TagThumbnail>()
                .HasKey(tt => new { tt.TagId, tt.ThumbnailId });

            modelBuilder.Entity<TagThumbnail>()
                .HasOne(tt => tt.Tag)
                .WithMany(t => t.TagThumbnails)
                .HasForeignKey(tt => tt.TagId);

            modelBuilder.Entity<TagThumbnail>()
                .HasOne(tt => tt.Thumbnail)
                .WithMany(t => t.TagThumbnails)
                .HasForeignKey(tt => tt.ThumbnailId);


            modelBuilder.Entity<Thumbnail>()
                .Property(f => f.FileCreateDateTime)
                .HasColumnType("datetime2(7)");

            modelBuilder.Entity<Face>()
                .HasKey(i=> i.Id)
                .IsClustered(false);

            modelBuilder.Entity<Face>()
                .HasIndex(i => new { i.IsValid, i.NeedsValidation })
                .IsClustered();

            #region Seeding Data

            modelBuilder.Entity<TagType>().HasData(new TagType { Id = Constants.Tags.PersonTagTypeId, Name = Constants.Tags.PersonTagType, Created = DateTime.Now, CreatedBy = "SeedData" });
            modelBuilder.Entity<Tag>().HasData(new Tag { Id = Constants.Tags.UnknownTagId, Name = Constants.Tags.UnknownTag, TagTypeId = 1, Created = DateTime.Now, CreatedBy = "SeedData" });

            #endregion

        }



        #region SaveChanges overrides

        /// <summary>
        /// Adds additional behaviors to a synchronous SaveChanges() call.
        /// </summary>
        /// <returns></returns>
        public override int SaveChanges()
        {
            return this.SaveChanges(true);
        }

        /// <summary>
        /// Adds additional behaviors to a synchronous SaveChanges() call.
        /// </summary>
        /// <returns></returns>
        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {

            AddTracking();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        /// <summary>
        /// Saves changes.
        /// </summary>
        /// <returns></returns>
        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default(CancellationToken))
        {
            return this.SaveChangesAsync(true, cancellationToken);
        }

        /// <summary>
        /// Adds additional behaviors to asynchronous SaveChanges() calls.
        /// </summary>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess,
            CancellationToken cancellationToken = default(CancellationToken))
        {
            AddTracking();
            return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }
        private void AddTracking()
        {
            var identityName = _httpContextAccessor?.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "System";
            
            var now = DateTime.Now;

            var entries = ChangeTracker.Entries<AuditableEntity>();
            foreach (var entry in entries.Where(e=> e.State == EntityState.Added || e.State == EntityState.Modified))
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedBy = identityName;
                        entry.Entity.Created = now;
                        entry.Property(e => e.LastUpdated).IsModified = false;
                        entry.Property(e => e.LastUpdatedBy).IsModified = false;
                        break;

                    case EntityState.Modified:
                        entry.Property(e => e.Created).IsModified = false;
                        entry.Property(e => e.CreatedBy).IsModified = false;
                        entry.Entity.LastUpdatedBy = identityName;
                        entry.Entity.LastUpdated = now;
                        break;

                    default:
                        Logger.Info($"Entity record {entry.GetType()} was {entry.State.ToString().ToLower()}. Any audit fields will be ignored.");
                        break;
                }
            }
        }
        #endregion
    }
}