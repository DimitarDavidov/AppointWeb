using AppointWeb.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Data.Seeding;

// Populates the database with a realistic demo dataset: providers and customers,
// bookable services, availability, past and future appointments across every
// status, plus two-directional ratings, comments and in-app notifications.
// Safe to run repeatedly - it no-ops once the demo data is present.

public static class DatabaseSeeder
{
    private const string DemoPassword = "Password123!";
    private const string MarkerEmail = "dr.smith@appointweb.dev";
    private const string TimeZone = "Europe/Sofia";

    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync(u => u.Email == MarkerEmail))
        {
            Console.WriteLine("Seed data already present - skipping. (Marker user exists.)");
            return;
        }

        Console.WriteLine("Seeding demo data...");

        var hasher = new PasswordHasher<User>();
        string Hash(User u) => hasher.HashPassword(u, DemoPassword);

        // ---- Providers -----------------------------------------------------
        var smith = NewUser("dr.smith", MarkerEmail, UserRoles.Provider, "+359881000001");
        var mike = NewUser("coach.mike", "coach.mike@appointweb.dev", UserRoles.Provider, "+359881000002");
        var bella = NewUser("bella.beauty", "bella.beauty@appointweb.dev", UserRoles.Provider, "+359881000003");
        var tom = NewUser("tutor.tom", "tutor.tom@appointweb.dev", UserRoles.Provider, "+359881000004");

        // ---- Customers -----------------------------------------------------
        var emma = NewUser("emma", "emma@appointweb.dev", UserRoles.Customer, "+359882000001");
        var frank = NewUser("frank", "frank@appointweb.dev", UserRoles.Customer, "+359882000002");
        var grace = NewUser("grace", "grace@appointweb.dev", UserRoles.Customer, "+359882000003");
        var henry = NewUser("henry", "henry@appointweb.dev", UserRoles.Customer, "+359882000004");
        var iris = NewUser("iris", "iris@appointweb.dev", UserRoles.Customer, "+359882000005");

        var users = new[] { smith, mike, bella, tom, emma, frank, grace, henry, iris };
        foreach (var u in users)
            u.PasswordHash = Hash(u);

        db.Users.AddRange(users);

        // ---- Services ------------------------------------------------------
        var dentalCheckup = NewService("Dental Checkup & Cleaning",
            "Routine dental exam, scaling and polishing.",
            ServiceCategories.HealthcareAndDental, "Bulgaria", "Sofia", 45, 80m);
        var whitening = NewService("Teeth Whitening",
            "Professional in-office whitening treatment.",
            ServiceCategories.HealthcareAndDental, "Bulgaria", "Sofia", 60, 150m);

        var personalTraining = NewService("Personal Training Session",
            "One-on-one strength and conditioning session.",
            ServiceCategories.SportsAndFitness, "Bulgaria", "Sofia", 60, 50m);

        var haircut = NewService("Haircut & Styling",
            "Cut, wash and blow-dry with a stylist.",
            ServiceCategories.BeautyAndWellness, "Bulgaria", "Plovdiv", 45, 40m);
        var massage = NewService("Relaxing Full-Body Massage",
            "90-minute deep-relaxation massage.",
            ServiceCategories.BeautyAndWellness, "Bulgaria", "Plovdiv", 90, 90m);

        var guitarLesson = NewService("Guitar Lesson",
            "Beginner to intermediate acoustic guitar coaching.",
            ServiceCategories.ClassesAndCoaching, "Bulgaria", "Sofia", 60, 35m, isRemote: true);

        var services = new[]
        {
            dentalCheckup, whitening, personalTraining, haircut, massage, guitarLesson,
        };
        db.Services.AddRange(services);

        // ---- Provider <-> Service links + availability ---------------------
        LinkOffering(db, smith, dentalCheckup);
        LinkOffering(db, smith, whitening);
        LinkOffering(db, mike, personalTraining);
        LinkOffering(db, bella, haircut);
        LinkOffering(db, bella, massage);
        LinkOffering(db, tom, guitarLesson);

        // ---- Appointments --------------------------------------------------
        var appointments = new List<Appointment>();
        var ratings = new List<Rating>();
        var notifications = new List<Notification>();

        // Past: Completed with mutual 5-star reviews.
        var a1 = Appt(emma, smith, dentalCheckup, AtUtc(-14, 9, 0), AppointmentStatus.Completed);
        appointments.Add(a1);
        ratings.Add(Rate(a1, emma, smith, RatingDirection.CustomerToProvider, 5.0m,
            "Dr. Smith was gentle and thorough. Best cleaning I've had.", -14));
        ratings.Add(Rate(a1, smith, emma, RatingDirection.ProviderToCustomer, 5.0m,
            "Lovely patient, arrived on time.", -14));

        // Past: Completed, good but not perfect.
        var a2 = Appt(frank, smith, whitening, AtUtc(-10, 11, 0), AppointmentStatus.Completed);
        appointments.Add(a2);
        ratings.Add(Rate(a2, frank, smith, RatingDirection.CustomerToProvider, 4.5m,
            "Results were great, waiting room was a bit busy though.", -10));
        ratings.Add(Rate(a2, smith, frank, RatingDirection.ProviderToCustomer, 4.0m, null, -10));

        // Past: Completed personal training.
        var a3 = Appt(grace, mike, personalTraining, AtUtc(-5, 8, 0), AppointmentStatus.Completed);
        appointments.Add(a3);
        ratings.Add(Rate(a3, grace, mike, RatingDirection.CustomerToProvider, 4.0m,
            "Tough session but Mike really pushes you. Felt great after.", -5));
        ratings.Add(Rate(a3, mike, grace, RatingDirection.ProviderToCustomer, 5.0m,
            "Motivated and hard-working. A pleasure to train.", -5));

        // Past: NoShow - customer never turned up. Provider leaves a low rating.
        var a4 = Appt(henry, mike, personalTraining, AtUtc(-3, 10, 0), AppointmentStatus.NoShow);
        appointments.Add(a4);
        ratings.Add(Rate(a4, mike, henry, RatingDirection.ProviderToCustomer, 1.0m,
            "Booked a slot and did not show up or cancel.", -3));

        // Past: Completed haircut with mutual comments.
        var a5 = Appt(iris, bella, haircut, AtUtc(-7, 13, 0), AppointmentStatus.Completed);
        appointments.Add(a5);
        ratings.Add(Rate(a5, iris, bella, RatingDirection.CustomerToProvider, 5.0m,
            "Bella nailed exactly the style I wanted. Highly recommend!", -7));
        ratings.Add(Rate(a5, bella, iris, RatingDirection.ProviderToCustomer, 4.5m,
            "Clear about what she wanted, very friendly.", -7));

        // Past: Cancelled by the customer (with a reason). No public rating.
        var a6 = Appt(emma, bella, massage, AtUtc(-4, 15, 0), AppointmentStatus.Cancelled);
        a6.CancellationReason = "Came down with a cold, rescheduling for later.";
        a6.CancelledByUserId = emma.Id;
        appointments.Add(a6);

        // Past: Completed guitar lesson (remote) with reviews.
        var a7 = Appt(frank, tom, guitarLesson, AtUtc(-6, 17, 0), AppointmentStatus.Completed);
        appointments.Add(a7);
        ratings.Add(Rate(a7, frank, tom, RatingDirection.CustomerToProvider, 4.5m,
            "Patient teacher, great for beginners. Online setup worked well.", -6));
        ratings.Add(Rate(a7, tom, frank, RatingDirection.ProviderToCustomer, 5.0m,
            "Practiced between sessions - great progress.", -6));

        // Past: NoShow marked by the provider (dentist), leaves a rating.
        var a8 = Appt(grace, smith, dentalCheckup, AtUtc(-2, 14, 0), AppointmentStatus.NoShow);
        appointments.Add(a8);
        ratings.Add(Rate(a8, smith, grace, RatingDirection.ProviderToCustomer, 2.0m,
            "No-show without notice.", -2));

        // Past: Cancelled by the provider.
        var a9 = Appt(henry, bella, haircut, AtUtc(-1, 10, 0), AppointmentStatus.Cancelled);
        a9.CancellationReason = "Stylist was unwell, salon closed for the day.";
        a9.CancelledByUserId = bella.Id;
        appointments.Add(a9);

        // Future: Booked (confirmed) appointments.
        var a10 = Appt(emma, smith, dentalCheckup, AtUtc(3, 9, 0), AppointmentStatus.Booked);
        appointments.Add(a10);

        var a11 = Appt(henry, smith, whitening, AtUtc(6, 11, 0), AppointmentStatus.Booked);
        appointments.Add(a11);

        var a12 = Appt(grace, bella, massage, AtUtc(5, 12, 0), AppointmentStatus.Booked);
        appointments.Add(a12);

        // Future: Pending (awaiting provider confirmation).
        var a13 = Appt(frank, mike, personalTraining, AtUtc(2, 10, 0), AppointmentStatus.Pending);
        appointments.Add(a13);

        var a14 = Appt(iris, tom, guitarLesson, AtUtc(4, 16, 0), AppointmentStatus.Pending);
        appointments.Add(a14);

        // Future: Booked but with a pending reschedule proposed by the provider.
        var a15 = Appt(emma, mike, personalTraining, AtUtc(7, 9, 0), AppointmentStatus.Booked);
        a15.PendingRescheduleStartTime = AtUtc(8, 9, 0);
        a15.PendingRescheduleEndTime = AtUtc(8, 10, 0);
        a15.RescheduleReason = "Could we move to the next morning? A slot opened up.";
        a15.RescheduleRequestedByUserId = mike.Id;
        a15.PendingRescheduleFromConfirmedSlot = true;
        a15.ProviderRescheduleCount = 1;
        appointments.Add(a15);

        db.Appointments.AddRange(appointments);
        db.Ratings.AddRange(ratings);

        // ---- Notifications -------------------------------------------------
        notifications.Add(Notify(smith, a13, NotificationType.RescheduleReceived,
            "New booking request",
            "Frank requested a Personal Training Session. Awaiting your confirmation.", isRead: false));
        notifications.Add(Notify(emma, a10, NotificationType.AppointmentConfirmed,
            "Appointment confirmed",
            "Your Dental Checkup & Cleaning with dr.smith is confirmed.", isRead: true));
        notifications.Add(Notify(emma, a15, NotificationType.RescheduleReceived,
            "Reschedule proposed",
            "coach.mike proposed a new time for your Personal Training Session.", isRead: false));
        notifications.Add(Notify(henry, a9, NotificationType.AppointmentCancelled,
            "Appointment cancelled",
            "Your Haircut & Styling was cancelled: stylist was unwell.", isRead: false));
        notifications.Add(Notify(grace, a12, NotificationType.AppointmentConfirmed,
            "Appointment confirmed",
            "Your Relaxing Full-Body Massage with bella.beauty is confirmed.", isRead: false));

        db.Notifications.AddRange(notifications);

        await db.SaveChangesAsync();

        Console.WriteLine(
            $"Seed complete: {users.Length} users, {services.Length} services, " +
            $"{appointments.Count} appointments, {ratings.Count} ratings, " +
            $"{notifications.Count} notifications.");
        Console.WriteLine($"All demo accounts use the password: {DemoPassword}");
    }

    private static User NewUser(string username, string email, string role, string phone) =>
        new()
        {
            Username = username.ToLowerInvariant(),
            Email = email.ToLowerInvariant(),
            Role = role,
            PhoneNumber = phone,
            TimeZoneId = TimeZone,
            CreatedAt = DateTime.UtcNow,
        };

    private static Service NewService(
        string name, string description, string category,
        string country, string city, int durationMinutes, decimal price,
        bool isRemote = false) =>
        new()
        {
            Name = name,
            Description = description,
            Category = category,
            Country = country,
            City = city,
            IsRemote = isRemote,
            DurationMinutes = durationMinutes,
            Price = price,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

    private static void LinkOffering(AppDbContext db, User provider, Service service)
    {
        db.ProviderServices.Add(new ProviderService
        {
            ProviderId = provider.Id,
            ServiceId = service.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        });

        // Monday-Friday, 09:00-17:00 (provider wall-clock time).
        for (var day = 1; day <= 5; day++)
        {
            db.ProviderAvailabilities.Add(new ProviderAvailability
            {
                ProviderId = provider.Id,
                ServiceId = service.Id,
                DayOfWeek = day,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(17, 0),
            });
        }
    }

    private static Appointment Appt(
        User customer, User provider, Service service,
        DateTime startUtc, AppointmentStatus status) =>
        new()
        {
            CustomerId = customer.Id,
            ProviderId = provider.Id,
            ServiceId = service.Id,
            StartTime = startUtc,
            EndTime = startUtc.AddMinutes(service.DurationMinutes),
            Status = status,
            PriceAtBooking = service.Price,
            CreatedAt = DateTime.UtcNow,
        };

    private static Rating Rate(
        Appointment appointment, User rater, User ratee,
        RatingDirection direction, decimal? stars, string? comment, int dayOffset)
    {
        var when = AtUtc(dayOffset, 18, 0);
        return new Rating
        {
            AppointmentId = appointment.Id,
            ServiceId = appointment.ServiceId,
            RaterId = rater.Id,
            RateeId = ratee.Id,
            Direction = direction,
            Stars = stars,
            Comment = comment,
            CreatedAt = when,
            UpdatedAt = when,
        };
    }

    private static Notification Notify(
        User user, Appointment appointment, string type,
        string title, string message, bool isRead) =>
        new()
        {
            UserId = user.Id,
            AppointmentId = appointment.Id,
            Type = type,
            Title = title,
            Message = message,
            IsRead = isRead,
            CreatedAt = DateTime.UtcNow,
        };

    private static DateTime AtUtc(int dayOffset, int hour, int minute)
    {
        var date = DateTime.UtcNow.Date.AddDays(dayOffset);
        return new DateTime(date.Year, date.Month, date.Day, hour, minute, 0, DateTimeKind.Utc);
    }
}
