using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointWeb.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentDoubleBookingConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"CREATE EXTENSION IF NOT EXISTS btree_gist;");

            migrationBuilder.Sql(@"
                                ALTER TABLE ""Appointments""
                                    ADD CONSTRAINT ""EX_Appointments_NoOverlap_PerProvider""
                                    EXCLUDE USING gist
                                    (
                                      ""ProviderId"" WITH =,
                                      tstzrange(""StartTime"", ""EndTime"", '[)') WITH &&
                                    )
                                    WHERE (""Status"" = 0);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                            ALTER TABLE ""Appointments""
                            DROP CONSTRAINT IF EXISTS ""EX_Appointments_NoOverlap_PerProvider"";
                            ");
        }
    }
}
