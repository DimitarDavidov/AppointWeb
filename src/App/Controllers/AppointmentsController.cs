using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Appointments;
using AppointWeb.Api.Extensions;
using AppointWeb.Api.Models;
using AppointWeb.Api.Options;
using AppointWeb.Api.Services;
using AppointWeb.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;
using System.Globalization;
using System.Security.Claims;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly FrontendSettings _frontendSettings;
    private readonly ILogger<AppointmentsController> _logger;

    public AppointmentsController(
        AppDbContext db,
        IEmailService emailService,
        INotificationService notificationService,
        IOptions<FrontendSettings> frontendSettings,
        ILogger<AppointmentsController> logger)
    {
        _db = db;
        _emailService = emailService;
        _notificationService = notificationService;
        _frontendSettings = frontendSettings.Value;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppointmentDetailResponse>>> GetMine(
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var role = User.FindFirstValue(ClaimTypes.Role);

        var appointments = await AppointmentMapper.ProjectToDetail(
                FilterAppointmentsForUser(userId, role), userId)
            .OrderBy(a => a.StartTime)
            .ToListAsync(ct);

        return Ok(appointments);
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentResponse>> Create(
        CreateAppointmentRequest request,
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var customerId))
            return Unauthorized("Invalid token: missing user id.");

        if (customerId == request.ProviderId)
            return BadRequest("You cannot book your own services.");

        var startUtc = request.StartTime.Kind == DateTimeKind.Utc
            ? request.StartTime
            : request.StartTime.ToUniversalTime();

        if (startUtc < DateTime.UtcNow.AddMinutes(-1))
            return BadRequest("Invalid start time.");

        var service = await _db.Services
            .AsNoTracking()
            .SingleOrDefaultAsync(s => s.Id == request.ServiceId && s.IsActive, ct);

        if (service is null)
            return NotFound("Service not found.");

        var provider = await _db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(u => u.Id == request.ProviderId, ct);

        if (provider is null)
            return NotFound("Provider not found.");

        var customer = await _db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(u => u.Id == customerId, ct);

        if (customer is null)
            return Unauthorized("Invalid token: missing user id.");

        if (provider.Role != UserRoles.Provider)
            return BadRequest("The selected user is not a provider.");

        var offersService = await _db.ProviderServices.AsNoTracking().AnyAsync(ps =>
            ps.ProviderId == request.ProviderId &&
            ps.ServiceId == request.ServiceId &&
            ps.IsActive, ct);

        if (!offersService)
            return BadRequest("This provider does not offer the selected service.");

        var endUtc = startUtc.AddMinutes(service.DurationMinutes);

        if (!await FitsProviderAvailabilityAsync(
                request.ProviderId, request.ServiceId, startUtc, endUtc, ct))
        {
            return BadRequest("The selected time is outside this service's availability.");
        }

        var overlaps = await _db.Appointments.AsNoTracking().AnyAsync(a =>
            a.ProviderId == request.ProviderId &&
            (a.Status == AppointmentStatus.Booked || a.Status == AppointmentStatus.Pending) &&
            a.StartTime < endUtc &&
            a.EndTime > startUtc, ct);

        if (overlaps)
            return Conflict("This time slot is already booked.");

        var appointment = new Appointment
        {
            CustomerId = customerId,
            ProviderId = request.ProviderId,
            ServiceId = request.ServiceId,
            StartTime = startUtc,
            EndTime = endUtc,
            Status = AppointmentStatus.Pending,
            PriceAtBooking = service.Price
        };

        _db.Appointments.Add(appointment);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23P01")
        {
            return Conflict("This time slot is already booked.");
        }

        try
        {
            var appointmentWhen = appointment.StartTime.ToString(
                "dddd, MMMM d, yyyy 'at' h:mm tt 'UTC'",
                CultureInfo.InvariantCulture);
            var providerPanelUrl = $"{_frontendSettings.BaseUrl.TrimEnd('/')}/provider";

            await _emailService.SendAppointmentRequestEmailAsync(
                provider.Email,
                provider.Username,
                customer.Username,
                customer.PhoneNumber,
                service.Name,
                appointmentWhen,
                providerPanelUrl,
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send appointment request email for appointment {AppointmentId}",
                appointment.Id);
        }

        return Ok(AppointmentMapper.MapResponse(appointment));
    }

    [HttpPatch("{id:guid}/cancel")]
    public async Task<ActionResult<AppointmentResponse>> Cancel(
        Guid id,
        [FromBody] CancelAppointmentRequest? request,
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var role = User.FindFirstValue(ClaimTypes.Role);

        var appointment = await _db.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Provider)
            .Include(a => a.Service)
            .SingleOrDefaultAsync(a => a.Id == id, ct);

        if (appointment is null)
            return NotFound();

        if (!CanAccessAppointment(appointment, userId, role))
            return Forbid();

        if (!AppointmentStatusMapper.CanBeModified(appointment.Status))
            return BadRequest("Only active appointments can be cancelled.");

        var notifyCustomer = appointment.CustomerId != userId;
        var notifyProvider = appointment.CustomerId == userId;

        var reason = string.IsNullOrWhiteSpace(request?.Reason)
            ? null
            : request!.Reason.Trim();
        appointment.CancellationReason = reason;
        appointment.CancelledByUserId = userId;
        ClearPendingReschedule(appointment);

        appointment.Status = AppointmentStatus.Cancelled;
        await _db.SaveChangesAsync(ct);

        var appointmentWhen = appointment.StartTime.ToString(
            "dddd, MMMM d, yyyy 'at' h:mm tt 'UTC'",
            CultureInfo.InvariantCulture);

        if (notifyCustomer)
        {
            try
            {
                await _emailService.SendAppointmentCancelledEmailAsync(
                    appointment.Customer.Email,
                    appointment.Customer.Username,
                    appointment.Provider.Username,
                    appointment.Service.Name,
                    appointmentWhen,
                    reason,
                    ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send cancellation email for appointment {AppointmentId}",
                    appointment.Id);
            }

            try
            {
                await _notificationService.NotifyAppointmentCancelledAsync(
                    appointment,
                    appointment.CustomerId,
                    appointment.Provider.Username,
                    ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create cancellation notification for appointment {AppointmentId}",
                    appointment.Id);
            }
        }

        if (notifyProvider)
        {
            try
            {
                await _emailService.SendCustomerCancelledAppointmentEmailAsync(
                    appointment.Provider.Email,
                    appointment.Provider.Username,
                    appointment.Customer.Username,
                    appointment.Service.Name,
                    appointmentWhen,
                    reason,
                    ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send customer cancellation email for appointment {AppointmentId}",
                    appointment.Id);
            }

            try
            {
                await _notificationService.NotifyAppointmentCancelledAsync(
                    appointment,
                    appointment.ProviderId,
                    appointment.Customer.Username,
                    ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create cancellation notification for appointment {AppointmentId}",
                    appointment.Id);
            }
        }

        return Ok(AppointmentMapper.MapResponse(appointment));
    }

    [HttpPatch("{id:guid}/confirm")]
    public async Task<ActionResult<AppointmentResponse>> Confirm(Guid id, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var role = User.FindFirstValue(ClaimTypes.Role);

        if (role != UserRoles.Provider && role != UserRoles.Admin)
            return Forbid();

        var appointment = await _db.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Provider)
            .Include(a => a.Service)
            .SingleOrDefaultAsync(a => a.Id == id, ct);

        if (appointment is null)
            return NotFound();

        if (role != UserRoles.Admin && appointment.ProviderId != userId)
            return Forbid();

        if (appointment.Status != AppointmentStatus.Pending)
            return BadRequest("Only pending appointments can be confirmed.");

        var overlaps = await _db.Appointments.AsNoTracking().AnyAsync(a =>
            a.Id != id &&
            a.ProviderId == appointment.ProviderId &&
            (a.Status == AppointmentStatus.Booked || a.Status == AppointmentStatus.Pending) &&
            a.StartTime < appointment.EndTime &&
            a.EndTime > appointment.StartTime, ct);

        if (overlaps)
            return Conflict("This time slot is already booked.");

        appointment.Status = AppointmentStatus.Booked;

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23P01")
        {
            return Conflict("This time slot is already booked.");
        }

        try
        {
            var appointmentWhen = FormatAppointmentWhen(appointment.StartTime);
            var appointmentsUrl = $"{_frontendSettings.BaseUrl.TrimEnd('/')}/appointments";

            await _emailService.SendAppointmentConfirmedEmailAsync(
                appointment.Customer.Email,
                appointment.Customer.Username,
                appointment.Provider.Username,
                appointment.Service.Name,
                appointmentWhen,
                appointmentsUrl,
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send appointment confirmed email for appointment {AppointmentId}",
                appointment.Id);
        }

        try
        {
            await _notificationService.NotifyAppointmentConfirmedAsync(appointment, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to create appointment confirmed notification for appointment {AppointmentId}",
                appointment.Id);
        }

        return Ok(AppointmentMapper.MapResponse(appointment));
    }

    [HttpPatch("{id:guid}/reschedule")]
    public async Task<ActionResult<AppointmentResponse>> Reschedule(
        Guid id,
        RescheduleAppointmentRequest request,
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var role = User.FindFirstValue(ClaimTypes.Role);

        var appointment = await _db.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Provider)
            .Include(a => a.Service)
            .SingleOrDefaultAsync(a => a.Id == id, ct);

        if (appointment is null)
            return NotFound();

        if (!CanAccessAppointment(appointment, userId, role))
            return Forbid();

        if (!AppointmentStatusMapper.CanBeModified(appointment.Status))
            return BadRequest("Only active appointments can be rescheduled.");

        var isCustomerRescheduling = appointment.CustomerId == userId;
        var notifyProvider = isCustomerRescheduling;
        var notifyCustomer = !isCustomerRescheduling;

        var reason = string.IsNullOrWhiteSpace(request.Reason)
            ? null
            : request.Reason.Trim();

        if (notifyCustomer && reason is null)
            return BadRequest("A reason is required when requesting to reschedule a customer's appointment.");

        var startUtc = request.StartTime.Kind == DateTimeKind.Utc
            ? request.StartTime
            : request.StartTime.ToUniversalTime();

        if (startUtc < DateTime.UtcNow.AddMinutes(-1))
            return BadRequest("Invalid start time.");

        if (startUtc == appointment.StartTime)
            return BadRequest("The requested time must be different from the current appointment time.");

        if (!appointment.Service.IsActive)
            return BadRequest("This service is no longer available.");

        var endUtc = startUtc.AddMinutes(appointment.Service.DurationMinutes);

        if (!await FitsProviderAvailabilityAsync(
                appointment.ProviderId, appointment.ServiceId, startUtc, endUtc, ct))
            return BadRequest("The selected time is outside this service's availability.");

        if (!await IsProposedSlotAvailableAsync(appointment, startUtc, endUtc, ct))
            return Conflict("This time slot is already booked.");

        var previousWhen = FormatAppointmentWhen(appointment.StartTime);
        var newWhen = FormatAppointmentWhen(startUtc);
        var frontendBaseUrl = _frontendSettings.BaseUrl.TrimEnd('/');

        // If there's already a pending proposal from the other party, this
        // request is a counter-offer: remember the time being countered.
        var isCounterProposal =
            appointment.PendingRescheduleStartTime is not null &&
            appointment.RescheduleRequestedByUserId is not null &&
            appointment.RescheduleRequestedByUserId != userId;

        appointment.CounteredRescheduleStartTime = isCounterProposal
            ? appointment.PendingRescheduleStartTime
            : null;

        string? counteredWhen = isCounterProposal
            ? FormatAppointmentWhen(appointment.CounteredRescheduleStartTime!.Value)
            : null;

        appointment.PendingRescheduleStartTime = startUtc;
        appointment.PendingRescheduleEndTime = endUtc;
        appointment.RescheduleReason = reason;
        appointment.RescheduleRequestedByUserId = userId;
        appointment.PendingRescheduleFromConfirmedSlot =
            appointment.PendingRescheduleFromConfirmedSlot || HadConfirmedTime(appointment);
        appointment.Status = AppointmentStatus.Pending;

        await _db.SaveChangesAsync(ct);

        if (notifyProvider)
        {
            try
            {
                await _emailService.SendCustomerRescheduledAppointmentEmailAsync(
                    appointment.Provider.Email,
                    appointment.Provider.Username,
                    appointment.Customer.Username,
                    appointment.Service.Name,
                    previousWhen,
                    newWhen,
                    counteredWhen,
                    reason,
                    $"{frontendBaseUrl}/provider",
                    ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send customer reschedule email for appointment {AppointmentId}",
                    appointment.Id);
            }

            try
            {
                await _notificationService.NotifyRescheduleReceivedAsync(
                    appointment,
                    appointment.ProviderId,
                    appointment.Customer.Username,
                    startUtc,
                    ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create reschedule notification for appointment {AppointmentId}",
                    appointment.Id);
            }
        }

        if (notifyCustomer)
        {
            try
            {
                await _emailService.SendProviderRescheduledAppointmentEmailAsync(
                    appointment.Customer.Email,
                    appointment.Customer.Username,
                    appointment.Provider.Username,
                    appointment.Service.Name,
                    previousWhen,
                    newWhen,
                    counteredWhen,
                    reason!,
                    $"{frontendBaseUrl}/appointments",
                    ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send provider reschedule email for appointment {AppointmentId}",
                    appointment.Id);
            }

            try
            {
                await _notificationService.NotifyRescheduleReceivedAsync(
                    appointment,
                    appointment.CustomerId,
                    appointment.Provider.Username,
                    startUtc,
                    ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create reschedule notification for appointment {AppointmentId}",
                    appointment.Id);
            }
        }

        return Ok(AppointmentMapper.MapResponse(appointment));
    }

    [HttpPatch("{id:guid}/reschedule/accept")]
    public async Task<ActionResult<AppointmentResponse>> AcceptReschedule(
        Guid id,
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var role = User.FindFirstValue(ClaimTypes.Role);

        var appointment = await _db.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Provider)
            .Include(a => a.Service)
            .SingleOrDefaultAsync(a => a.Id == id, ct);

        if (appointment is null)
            return NotFound();

        if (!CanAccessAppointment(appointment, userId, role))
            return Forbid();

        if (!AppointmentStatusMapper.CanBeModified(appointment.Status))
            return BadRequest("Only active appointments can be updated.");

        if (appointment.PendingRescheduleStartTime is null ||
            appointment.PendingRescheduleEndTime is null ||
            appointment.RescheduleRequestedByUserId is null)
        {
            return BadRequest("There is no pending reschedule request for this appointment.");
        }

        if (appointment.RescheduleRequestedByUserId == userId)
            return BadRequest("You cannot accept your own reschedule request.");

        if (!appointment.Service.IsActive)
            return BadRequest("This service is no longer available.");

        if (!await IsProposedSlotAvailableAsync(
                appointment,
                appointment.PendingRescheduleStartTime.Value,
                appointment.PendingRescheduleEndTime.Value,
                ct))
        {
            return Conflict("The requested time slot is no longer available.");
        }

        var previousStartUtc = appointment.StartTime;
        var newStartUtc = appointment.PendingRescheduleStartTime.Value;
        var previousWhen = FormatAppointmentWhen(previousStartUtc);
        var newWhen = FormatAppointmentWhen(newStartUtc);
        var requesterId = appointment.RescheduleRequestedByUserId.Value;
        var isCustomerRequester = requesterId == appointment.CustomerId;

        if (appointment.PendingRescheduleFromConfirmedSlot)
        {
            appointment.PreviousStartTime = appointment.StartTime;

            if (appointment.RescheduleRequestedByUserId == appointment.ProviderId)
                appointment.ProviderRescheduleCount++;
            else if (appointment.RescheduleRequestedByUserId == appointment.CustomerId)
                appointment.CustomerRescheduleCount++;
        }

        appointment.StartTime = appointment.PendingRescheduleStartTime.Value;
        appointment.EndTime = appointment.PendingRescheduleEndTime.Value;

        appointment.Status = AppointmentStatus.Booked;
        ClearPendingReschedule(appointment);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23P01")
        {
            return Conflict("The requested time slot is no longer available.");
        }

        try
        {
            var frontendBaseUrl = _frontendSettings.BaseUrl.TrimEnd('/');
            var requesterEmail = isCustomerRequester
                ? appointment.Customer.Email
                : appointment.Provider.Email;
            var requesterName = isCustomerRequester
                ? appointment.Customer.Username
                : appointment.Provider.Username;
            var accepterName = isCustomerRequester
                ? appointment.Provider.Username
                : appointment.Customer.Username;
            var appointmentsUrl = isCustomerRequester
                ? $"{frontendBaseUrl}/appointments"
                : $"{frontendBaseUrl}/provider";

            await _emailService.SendRescheduleAcceptedEmailAsync(
                requesterEmail,
                requesterName,
                accepterName,
                appointment.Service.Name,
                previousWhen,
                newWhen,
                appointmentsUrl,
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send reschedule accepted email for appointment {AppointmentId}",
                appointment.Id);
        }

        try
        {
            var accepterName = isCustomerRequester
                ? appointment.Provider.Username
                : appointment.Customer.Username;

            await _notificationService.NotifyRescheduleAcceptedAsync(
                appointment,
                requesterId,
                accepterName,
                previousStartUtc,
                newStartUtc,
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to create reschedule accepted notification for appointment {AppointmentId}",
                appointment.Id);
        }

        return Ok(AppointmentMapper.MapResponse(appointment));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<AppointmentResponse>> UpdateStatus(
        Guid id,
        UpdateAppointmentStatusRequest request,
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var role = User.FindFirstValue(ClaimTypes.Role);

        if (!AppointmentStatusMapper.TryParseOutcomeStatus(request.Status, out var newStatus))
            return BadRequest("Status must be Completed or NoShow.");

        var appointment = await _db.Appointments
            .SingleOrDefaultAsync(a => a.Id == id, ct);

        if (appointment is null)
            return NotFound();

        if (role != UserRoles.Admin &&
            appointment.ProviderId != userId &&
            appointment.CustomerId != userId)
            return Forbid();

        if (!AppointmentStatusMapper.CanSetOutcome(appointment.Status))
            return BadRequest("Only confirmed appointments can be updated with an outcome.");

        if (appointment.EndTime > DateTime.UtcNow)
            return BadRequest("This appointment has not finished yet.");

        appointment.Status = newStatus;
        ClearPendingReschedule(appointment);
        await _db.SaveChangesAsync(ct);

        return Ok(AppointmentMapper.MapResponse(appointment));
    }

    private static void ClearPendingReschedule(Appointment appointment)
    {
        appointment.PendingRescheduleStartTime = null;
        appointment.PendingRescheduleEndTime = null;
        appointment.CounteredRescheduleStartTime = null;
        appointment.RescheduleReason = null;
        appointment.RescheduleRequestedByUserId = null;
        appointment.PendingRescheduleFromConfirmedSlot = false;
    }

    private static bool HadConfirmedTime(Appointment appointment) =>
        appointment.Status == AppointmentStatus.Booked
        || appointment.PreviousStartTime != null
        || appointment.ProviderRescheduleCount > 0
        || appointment.CustomerRescheduleCount > 0;

    private static string FormatAppointmentWhen(DateTime utc) =>
        utc.ToString("dddd, MMMM d, yyyy 'at' h:mm tt 'UTC'", CultureInfo.InvariantCulture);

    private async Task<bool> IsProposedSlotAvailableAsync(
        Appointment appointment,
        DateTime startUtc,
        DateTime endUtc,
        CancellationToken ct)
    {
        return !await _db.Appointments.AsNoTracking().AnyAsync(a =>
            a.Id != appointment.Id &&
            a.ProviderId == appointment.ProviderId &&
            (a.Status == AppointmentStatus.Booked || a.Status == AppointmentStatus.Pending) &&
            a.StartTime < endUtc &&
            a.EndTime > startUtc, ct);
    }

    private IQueryable<Appointment> FilterAppointmentsForUser(Guid userId, string? role)
    {
        var query = _db.Appointments.AsNoTracking();

        if (role == UserRoles.Admin)
            return query;

        return query.Where(a => a.CustomerId == userId);
    }

    private static bool CanAccessAppointment(Appointment appointment, Guid userId, string? role)
    {
        if (role == UserRoles.Admin)
            return true;

        return appointment.CustomerId == userId || appointment.ProviderId == userId;
    }

    private async Task<bool> FitsProviderAvailabilityAsync(
        Guid providerId,
        Guid serviceId,
        DateTime startUtc,
        DateTime endUtc,
        CancellationToken ct)
    {
        var hasAvailabilityRules = await _db.ProviderAvailabilities
            .AsNoTracking()
            .AnyAsync(
                a => a.ProviderId == providerId && a.ServiceId == serviceId,
                ct);

        if (!hasAvailabilityRules)
            return true;

        // Availability windows are wall-clock times in the provider's timezone,
        // so convert the (UTC) booking start into the provider's local time
        // before comparing day-of-week and time-of-day.
        var providerTimeZoneId = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == providerId)
            .Select(u => u.TimeZoneId)
            .SingleOrDefaultAsync(ct);

        var providerTz = TimeZoneResolver.Resolve(providerTimeZoneId);
        var localStart = TimeZoneResolver.ToLocal(startUtc, providerTz);

        // Only the start time needs to fall within an availability window; the
        // appointment may run past the window end (e.g. a 1h service booked at
        // 5:30 when the provider works until 6:00 ends at 6:30 and is allowed).
        var startTime = TimeOnly.FromDateTime(localStart);
        var dayOfWeek = (int)localStart.DayOfWeek;

        return await _db.ProviderAvailabilities.AsNoTracking().AnyAsync(a =>
            a.ProviderId == providerId &&
            a.ServiceId == serviceId &&
            a.DayOfWeek == dayOfWeek &&
            a.StartTime <= startTime &&
            a.EndTime > startTime, ct);
    }
}
