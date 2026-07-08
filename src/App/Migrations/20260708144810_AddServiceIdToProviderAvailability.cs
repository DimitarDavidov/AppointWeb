using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppointWeb.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceIdToProviderAvailability : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ProviderAvailabilities_ProviderId_DayOfWeek",
                table: "ProviderAvailabilities");

            migrationBuilder.AddColumn<Guid>(
                name: "ServiceId",
                table: "ProviderAvailabilities",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql(
                """
                INSERT INTO "ProviderAvailabilities" ("Id", "ProviderId", "ServiceId", "DayOfWeek", "StartTime", "EndTime")
                SELECT gen_random_uuid(), pa."ProviderId", ps."ServiceId", pa."DayOfWeek", pa."StartTime", pa."EndTime"
                FROM "ProviderAvailabilities" pa
                INNER JOIN "ProviderServices" ps
                    ON ps."ProviderId" = pa."ProviderId"
                   AND ps."IsActive" = TRUE
                INNER JOIN "Services" s
                    ON s."Id" = ps."ServiceId"
                   AND s."IsActive" = TRUE
                WHERE pa."ServiceId" IS NULL;
                """);

            migrationBuilder.Sql(
                """
                DELETE FROM "ProviderAvailabilities"
                WHERE "ServiceId" IS NULL;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "ServiceId",
                table: "ProviderAvailabilities",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProviderAvailabilities_ProviderId_ServiceId",
                table: "ProviderAvailabilities",
                columns: new[] { "ProviderId", "ServiceId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProviderAvailabilities_ServiceId_DayOfWeek",
                table: "ProviderAvailabilities",
                columns: new[] { "ServiceId", "DayOfWeek" });

            migrationBuilder.AddForeignKey(
                name: "FK_ProviderAvailabilities_Services_ServiceId",
                table: "ProviderAvailabilities",
                column: "ServiceId",
                principalTable: "Services",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProviderAvailabilities_Services_ServiceId",
                table: "ProviderAvailabilities");

            migrationBuilder.DropIndex(
                name: "IX_ProviderAvailabilities_ProviderId_ServiceId",
                table: "ProviderAvailabilities");

            migrationBuilder.DropIndex(
                name: "IX_ProviderAvailabilities_ServiceId_DayOfWeek",
                table: "ProviderAvailabilities");

            migrationBuilder.DropColumn(
                name: "ServiceId",
                table: "ProviderAvailabilities");

            migrationBuilder.CreateIndex(
                name: "IX_ProviderAvailabilities_ProviderId_DayOfWeek",
                table: "ProviderAvailabilities",
                columns: new[] { "ProviderId", "DayOfWeek" });
        }
    }
}
