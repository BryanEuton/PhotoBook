using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace PhotoBook.DataManager.Migrations
{
    public partial class v2 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BlacklistIds",
                table: "PhotoBooks",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WhitelistIds",
                table: "PhotoBooks",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "TagTypes",
                keyColumn: "Id",
                keyValue: 1L,
                column: "Created",
                value: new DateTime(2020, 8, 4, 8, 39, 58, 260, DateTimeKind.Local).AddTicks(113));

            migrationBuilder.UpdateData(
                table: "Tags",
                keyColumn: "Id",
                keyValue: 1L,
                column: "Created",
                value: new DateTime(2020, 8, 4, 8, 39, 58, 261, DateTimeKind.Local).AddTicks(4834));
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BlacklistIds",
                table: "PhotoBooks");

            migrationBuilder.DropColumn(
                name: "WhitelistIds",
                table: "PhotoBooks");

            migrationBuilder.UpdateData(
                table: "TagTypes",
                keyColumn: "Id",
                keyValue: 1L,
                column: "Created",
                value: new DateTime(2020, 3, 15, 10, 3, 49, 925, DateTimeKind.Local).AddTicks(6465));

            migrationBuilder.UpdateData(
                table: "Tags",
                keyColumn: "Id",
                keyValue: 1L,
                column: "Created",
                value: new DateTime(2020, 3, 15, 10, 3, 49, 927, DateTimeKind.Local).AddTicks(3555));
        }
    }
}
