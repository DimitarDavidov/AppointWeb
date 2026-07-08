using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointWeb.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCounteredRescheduleStartTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CounteredRescheduleStartTime",
                table: "Appointments",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CounteredRescheduleStartTime",
                table: "Appointments");
        }
    }
}
