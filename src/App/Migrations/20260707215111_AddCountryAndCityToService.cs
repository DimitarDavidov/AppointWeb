using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointWeb.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCountryAndCityToService : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Services",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "Services",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "Services");
        }
    }
}
