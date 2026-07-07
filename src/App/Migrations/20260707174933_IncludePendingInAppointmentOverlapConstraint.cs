using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointWeb.Api.Migrations
{
    /// <inheritdoc />
    public partial class IncludePendingInAppointmentOverlapConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Appointments"
                    DROP CONSTRAINT IF EXISTS "EX_Appointments_NoOverlap_PerProvider";
                """);

            migrationBuilder.Sql("""
                ALTER TABLE "Appointments"
                    ADD CONSTRAINT "EX_Appointments_NoOverlap_PerProvider"
                    EXCLUDE USING gist
                    (
                      "ProviderId" WITH =,
                      tstzrange("StartTime", "EndTime", '[)') WITH &&
                    )
                    WHERE ("Status" IN (0, 4));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Appointments"
                    DROP CONSTRAINT IF EXISTS "EX_Appointments_NoOverlap_PerProvider";
                """);

            migrationBuilder.Sql("""
                ALTER TABLE "Appointments"
                    ADD CONSTRAINT "EX_Appointments_NoOverlap_PerProvider"
                    EXCLUDE USING gist
                    (
                      "ProviderId" WITH =,
                      tstzrange("StartTime", "EndTime", '[)') WITH &&
                    )
                    WHERE ("Status" = 0);
                """);
        }
    }
}
