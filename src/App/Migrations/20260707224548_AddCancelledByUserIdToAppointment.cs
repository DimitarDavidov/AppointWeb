using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointWeb.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCancelledByUserIdToAppointment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CancelledByUserId",
                table: "Appointments",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CancelledByUserId",
                table: "Appointments");
        }
    }
}
