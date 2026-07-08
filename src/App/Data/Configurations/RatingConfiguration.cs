using AppointWeb.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AppointWeb.Api.Data.Configurations;

public class RatingConfiguration : IEntityTypeConfiguration<Rating>
{
    public void Configure(EntityTypeBuilder<Rating> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Direction)
               .IsRequired()
               .HasConversion<int>();

        builder.Property(r => r.Stars)
               .HasColumnType("numeric(2,1)");

        builder.Property(r => r.Comment)
               .HasMaxLength(1000);

        // Each participant may leave one rating per appointment.
        builder.HasIndex(r => new { r.AppointmentId, r.Direction }).IsUnique();

        // Backs per-service public aggregation (ratee = provider, service scoped).
        builder.HasIndex(r => new { r.RateeId, r.ServiceId, r.Direction });

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Rating_Stars_Range",
            "\"Stars\" IS NULL OR \"Stars\" IN (0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0)"));

        // A rating must carry at least a star value or a comment.
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Rating_NotEmpty",
            "\"Stars\" IS NOT NULL OR \"Comment\" IS NOT NULL"));

        builder
            .HasOne(r => r.Appointment)
            .WithMany(a => a.Ratings)
            .HasForeignKey(r => r.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(r => r.Service)
            .WithMany(s => s.Ratings)
            .HasForeignKey(r => r.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(r => r.Rater)
            .WithMany()
            .HasForeignKey(r => r.RaterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(r => r.Ratee)
            .WithMany()
            .HasForeignKey(r => r.RateeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
