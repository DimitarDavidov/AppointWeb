using AppointWeb.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AppointWeb.Api.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasIndex(u => u.Username).IsUnique();
        builder.Property(u => u.Email).IsRequired();
        builder.Property(u => u.Username).IsRequired().HasMaxLength(50);
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.Role).IsRequired();
        builder.Property(u => u.PhoneNumber).HasMaxLength(50);
        builder.Property(u => u.TimeZoneId)
            .IsRequired()
            .HasMaxLength(100)
            .HasDefaultValue("UTC");
        builder.Property(u => u.IsSuspended).HasDefaultValue(false);
    }
}