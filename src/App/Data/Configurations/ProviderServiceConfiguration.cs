using AppointWeb.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AppointWeb.Api.Data.Configurations;

public class ProviderServiceConfiguration : IEntityTypeConfiguration<ProviderService>
{
    public void Configure(EntityTypeBuilder<ProviderService> builder)
    {
        builder.HasIndex(ps => new { ps.ProviderId, ps.ServiceId }).IsUnique();

        builder.HasIndex(ps => ps.ServiceId);

        builder
            .HasOne(ps => ps.Provider)
            .WithMany(u => u.ProviderServices)
            .HasForeignKey(ps => ps.ProviderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(ps => ps.Service)
            .WithMany(s => s.ProviderServices)
            .HasForeignKey(ps => ps.ServiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
