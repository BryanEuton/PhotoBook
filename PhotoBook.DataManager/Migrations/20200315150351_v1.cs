using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace PhotoBook.DataManager.Migrations
{
    public partial class v1 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Components",
                columns: table => new
                {
                    Id = table.Column<long>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Created = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    LastUpdated = table.Column<DateTime>(nullable: true),
                    LastUpdatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    LongName = table.Column<string>(nullable: true),
                    ShortName = table.Column<string>(nullable: true),
                    TypesString = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Components", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FileSystemFolders",
                columns: table => new
                {
                    Id = table.Column<long>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Created = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    LastUpdated = table.Column<DateTime>(nullable: true),
                    LastUpdatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    Path = table.Column<string>(maxLength: 200, nullable: true),
                    ParentId = table.Column<long>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileSystemFolders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FileSystemFolders_FileSystemFolders_ParentId",
                        column: x => x.ParentId,
                        principalTable: "FileSystemFolders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    Id = table.Column<long>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Created = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    LastUpdated = table.Column<DateTime>(nullable: true),
                    LastUpdatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    Name = table.Column<string>(nullable: true),
                    PlaceId = table.Column<string>(nullable: true),
                    Latitude = table.Column<float>(nullable: true),
                    Longitude = table.Column<float>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PhotoBooks",
                columns: table => new
                {
                    Id = table.Column<long>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Created = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    LastUpdated = table.Column<DateTime>(nullable: true),
                    LastUpdatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    Title = table.Column<string>(maxLength: 100, nullable: false),
                    TimeFrame = table.Column<string>(maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhotoBooks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TagTypes",
                columns: table => new
                {
                    Id = table.Column<long>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Created = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    LastUpdated = table.Column<DateTime>(nullable: true),
                    LastUpdatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    Name = table.Column<string>(maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LocationComponent",
                columns: table => new
                {
                    LocationId = table.Column<long>(nullable: false),
                    ComponentId = table.Column<long>(nullable: false),
                    Created = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    LastUpdated = table.Column<DateTime>(nullable: true),
                    LastUpdatedBy = table.Column<string>(maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocationComponent", x => new { x.LocationId, x.ComponentId });
                    table.ForeignKey(
                        name: "FK_LocationComponent_Components_ComponentId",
                        column: x => x.ComponentId,
                        principalTable: "Components",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LocationComponent_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Thumbnails",
                columns: table => new
                {
                    Id = table.Column<long>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Created = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    LastUpdated = table.Column<DateTime>(nullable: true),
                    LastUpdatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    FileName = table.Column<string>(nullable: true),
                    FileSystemFolderId = table.Column<long>(nullable: false),
                    Bytes = table.Column<byte[]>(nullable: true),
                    Hide = table.Column<bool>(nullable: false),
                    Scanned = table.Column<bool>(nullable: false),
                    ImageWidth = table.Column<int>(nullable: false),
                    ImageHeight = table.Column<int>(nullable: false),
                    FileCreateDateTime = table.Column<DateTime>(type: "datetime2(7)", nullable: false),
                    Latitude = table.Column<float>(nullable: true),
                    Longitude = table.Column<float>(nullable: true),
                    LatLongFromImage = table.Column<bool>(nullable: false),
                    Altitude = table.Column<float>(nullable: true),
                    LocationId = table.Column<long>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Thumbnails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Thumbnails_FileSystemFolders_FileSystemFolderId",
                        column: x => x.FileSystemFolderId,
                        principalTable: "FileSystemFolders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Thumbnails_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Id = table.Column<long>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Created = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    LastUpdated = table.Column<DateTime>(nullable: true),
                    LastUpdatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    Name = table.Column<string>(maxLength: 100, nullable: false),
                    TagTypeId = table.Column<long>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tags_TagTypes_TagTypeId",
                        column: x => x.TagTypeId,
                        principalTable: "TagTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Comments",
                columns: table => new
                {
                    Id = table.Column<long>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Created = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    LastUpdated = table.Column<DateTime>(nullable: true),
                    LastUpdatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    Text = table.Column<string>(maxLength: 250, nullable: true),
                    ThumbnailId = table.Column<long>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Comments_Thumbnails_ThumbnailId",
                        column: x => x.ThumbnailId,
                        principalTable: "Thumbnails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PhotoItems",
                columns: table => new
                {
                    ThumbnailId = table.Column<long>(nullable: false),
                    PhotoBookId = table.Column<long>(nullable: false),
                    Created = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    LastUpdated = table.Column<DateTime>(nullable: true),
                    LastUpdatedBy = table.Column<string>(maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhotoItems", x => new { x.ThumbnailId, x.PhotoBookId });
                    table.ForeignKey(
                        name: "FK_PhotoItems_PhotoBooks_PhotoBookId",
                        column: x => x.PhotoBookId,
                        principalTable: "PhotoBooks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PhotoItems_Thumbnails_ThumbnailId",
                        column: x => x.ThumbnailId,
                        principalTable: "Thumbnails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Faces",
                columns: table => new
                {
                    Id = table.Column<long>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Created = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    LastUpdated = table.Column<DateTime>(nullable: true),
                    LastUpdatedBy = table.Column<string>(maxLength: 128, nullable: true),
                    Bytes = table.Column<byte[]>(nullable: true),
                    Distance = table.Column<double>(nullable: false),
                    Haar = table.Column<string>(nullable: true),
                    RectX = table.Column<int>(nullable: false),
                    RectY = table.Column<int>(nullable: false),
                    RectWidth = table.Column<int>(nullable: false),
                    RectHeight = table.Column<int>(nullable: false),
                    IsValid = table.Column<bool>(nullable: false),
                    NeedsValidation = table.Column<bool>(nullable: false),
                    TagId = table.Column<long>(nullable: true),
                    ThumbnailId = table.Column<long>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Faces", x => x.Id)
                        .Annotation("SqlServer:Clustered", false);
                    table.ForeignKey(
                        name: "FK_Faces_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Faces_Thumbnails_ThumbnailId",
                        column: x => x.ThumbnailId,
                        principalTable: "Thumbnails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TagThumbnails",
                columns: table => new
                {
                    TagId = table.Column<long>(nullable: false),
                    ThumbnailId = table.Column<long>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagThumbnails", x => new { x.TagId, x.ThumbnailId });
                    table.ForeignKey(
                        name: "FK_TagThumbnails_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TagThumbnails_Thumbnails_ThumbnailId",
                        column: x => x.ThumbnailId,
                        principalTable: "Thumbnails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "TagTypes",
                columns: new[] { "Id", "Created", "CreatedBy", "LastUpdated", "LastUpdatedBy", "Name" },
                values: new object[] { 1L, new DateTime(2020, 3, 15, 10, 3, 49, 925, DateTimeKind.Local).AddTicks(6465), "SeedData", null, null, "Person" });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "Created", "CreatedBy", "LastUpdated", "LastUpdatedBy", "Name", "TagTypeId" },
                values: new object[] { 1L, new DateTime(2020, 3, 15, 10, 3, 49, 927, DateTimeKind.Local).AddTicks(3555), "SeedData", null, null, "Unknown", 1L });

            migrationBuilder.CreateIndex(
                name: "IX_Comments_ThumbnailId",
                table: "Comments",
                column: "ThumbnailId");

            migrationBuilder.CreateIndex(
                name: "IX_Faces_TagId",
                table: "Faces",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_Faces_ThumbnailId",
                table: "Faces",
                column: "ThumbnailId");

            migrationBuilder.CreateIndex(
                name: "IX_Faces_IsValid_NeedsValidation",
                table: "Faces",
                columns: new[] { "IsValid", "NeedsValidation" })
                .Annotation("SqlServer:Clustered", true);

            migrationBuilder.CreateIndex(
                name: "IX_FileSystemFolders_ParentId",
                table: "FileSystemFolders",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_LocationComponent_ComponentId",
                table: "LocationComponent",
                column: "ComponentId");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoItems_PhotoBookId",
                table: "PhotoItems",
                column: "PhotoBookId");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoItems_ThumbnailId_PhotoBookId",
                table: "PhotoItems",
                columns: new[] { "ThumbnailId", "PhotoBookId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tags_TagTypeId",
                table: "Tags",
                column: "TagTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_TagThumbnails_ThumbnailId",
                table: "TagThumbnails",
                column: "ThumbnailId");

            migrationBuilder.CreateIndex(
                name: "IX_Thumbnails_FileSystemFolderId",
                table: "Thumbnails",
                column: "FileSystemFolderId");

            migrationBuilder.CreateIndex(
                name: "IX_Thumbnails_LocationId",
                table: "Thumbnails",
                column: "LocationId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Comments");

            migrationBuilder.DropTable(
                name: "Faces");

            migrationBuilder.DropTable(
                name: "LocationComponent");

            migrationBuilder.DropTable(
                name: "PhotoItems");

            migrationBuilder.DropTable(
                name: "TagThumbnails");

            migrationBuilder.DropTable(
                name: "Components");

            migrationBuilder.DropTable(
                name: "PhotoBooks");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "Thumbnails");

            migrationBuilder.DropTable(
                name: "TagTypes");

            migrationBuilder.DropTable(
                name: "FileSystemFolders");

            migrationBuilder.DropTable(
                name: "Locations");
        }
    }
}
