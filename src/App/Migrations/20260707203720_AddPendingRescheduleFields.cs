using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointWeb.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingRescheduleFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PendingRescheduleEndTime",
                table: "Appointments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PendingRescheduleStartTime",
                table: "Appointments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RescheduleReason",
                table: "Appointments",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RescheduleRequestedByUserId",
                table: "Appointments",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PendingRescheduleEndTime",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "PendingRescheduleStartTime",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "RescheduleReason",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "RescheduleRequestedByUserId",
                table: "Appointments");
        }
    }
}
