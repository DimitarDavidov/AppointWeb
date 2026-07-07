using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointWeb.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingRescheduleFromConfirmedSlot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PendingRescheduleFromConfirmedSlot",
                table: "Appointments",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PendingRescheduleFromConfirmedSlot",
                table: "Appointments");
        }
    }
}
