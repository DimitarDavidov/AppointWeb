using AppointWeb.Api.Models;

namespace AppointWeb.Api.Dtos.Appointments;

public static class AppointmentMapper
{
    public static IQueryable<AppointmentDetailResponse> ProjectToDetail(
        IQueryable<Appointment> query,
        Guid currentUserId) =>
        query.Select(a => new AppointmentDetailResponse
        {
            Id = a.Id,
            CustomerId = a.CustomerId,
            CustomerUsername = a.Customer.Username,
            CustomerPhoneNumber = a.Customer.PhoneNumber,
            ProviderId = a.ProviderId,
            ProviderUsername = a.Provider.Username,
            ServiceId = a.ServiceId,
            ServiceName = a.Service.Name,
            StartTime = a.StartTime,
            EndTime = a.EndTime,
            CreatedAt = a.CreatedAt,
            Status = AppointmentStatusMapper.ToApiStatus(a.Status),
            PriceAtBooking = a.PriceAtBooking,
            CancellationReason = a.CancellationReason,
            CancelledByUserId = a.CancelledByUserId,
            PendingRescheduleStartTime = a.PendingRescheduleStartTime,
            PendingRescheduleEndTime = a.PendingRescheduleEndTime,
            CounteredRescheduleStartTime = a.CounteredRescheduleStartTime,
            RescheduleReason = a.RescheduleReason,
            RescheduleRequestedByUserId = a.RescheduleRequestedByUserId,
            ProviderRescheduleCount = a.ProviderRescheduleCount,
            CustomerRescheduleCount = a.CustomerRescheduleCount,
            PreviousStartTime = a.PreviousStartTime,
            HasRated = a.Ratings.Any(r => r.RaterId == currentUserId),
            MyRatingStars = a.Ratings
                .Where(r => r.RaterId == currentUserId)
                .Select(r => r.Stars)
                .FirstOrDefault(),
            MyRatingComment = a.Ratings
                .Where(r => r.RaterId == currentUserId)
                .Select(r => r.Comment)
                .FirstOrDefault(),
        });

    public static AppointmentResponse MapResponse(Appointment appointment) =>
        new()
        {
            Id = appointment.Id,
            CustomerId = appointment.CustomerId,
            ProviderId = appointment.ProviderId,
            ServiceId = appointment.ServiceId,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Status = AppointmentStatusMapper.ToApiStatus(appointment.Status),
            PriceAtBooking = appointment.PriceAtBooking,
            CancellationReason = appointment.CancellationReason,
            PendingRescheduleStartTime = appointment.PendingRescheduleStartTime,
            PendingRescheduleEndTime = appointment.PendingRescheduleEndTime,
            CounteredRescheduleStartTime = appointment.CounteredRescheduleStartTime,
            RescheduleReason = appointment.RescheduleReason,
            RescheduleRequestedByUserId = appointment.RescheduleRequestedByUserId,
        };
}
