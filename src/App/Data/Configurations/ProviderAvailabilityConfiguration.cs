using AppointWeb.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AppointWeb.Api.Data.Configurations;

public class ProviderAvailabilityConfiguration : IEntityTypeConfiguration<ProviderAvailability>
{
    public void Configure(EntityTypeBuilder<ProviderAvailability> builder)
    {
        builder.HasIndex(a => a.ProviderId);

        builder.HasIndex(a => new { a.ServiceId, a.DayOfWeek });

        builder.HasIndex(a => new { a.ProviderId, a.ServiceId });

        builder.Property(a => a.DayOfWeek).IsRequired();

        builder.Property(a => a.StartTime).IsRequired();
        builder.Property(a => a.EndTime).IsRequired();

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_ProviderAvailability_DayOfWeek",
            "\"DayOfWeek\" >= 0 AND \"DayOfWeek\" <= 6"));

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_ProviderAvailability_StartBeforeEnd",
            "\"StartTime\" < \"EndTime\""));

        builder
            .HasOne(a => a.Provider)
            .WithMany(u => u.ProviderAvailabilities)
            .HasForeignKey(a => a.ProviderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(a => a.Service)
            .WithMany(s => s.Availabilities)
            .HasForeignKey(a => a.ServiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
