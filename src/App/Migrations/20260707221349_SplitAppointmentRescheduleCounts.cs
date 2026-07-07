using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointWeb.Api.Migrations
{
    /// <inheritdoc />
    public partial class SplitAppointmentRescheduleCounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RescheduleCount",
                table: "Appointments",
                newName: "ProviderRescheduleCount");

            migrationBuilder.AddColumn<int>(
                name: "CustomerRescheduleCount",
                table: "Appointments",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomerRescheduleCount",
                table: "Appointments");

            migrationBuilder.RenameColumn(
                name: "ProviderRescheduleCount",
                table: "Appointments",
                newName: "RescheduleCount");
        }
    }
}
