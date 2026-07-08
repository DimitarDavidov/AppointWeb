import { useEffect, useMemo, useState } from "react";
import {
  createProviderService,
  deactivateProviderService,
  deleteProviderService,
  reactivateProviderService,
  updateProviderService,
  updateProviderServiceAvailability,
} from "../../api/provider";
import { getErrorMessage } from "../../api/errors";
import { SpinnerIcon } from "../Account/AccountIcons";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import EditProviderAvailabilityModal from "./EditProviderAvailabilityModal";
import EditProviderServiceModal from "./EditProviderServiceModal";
import { ProviderAddServiceCard } from "./ProviderAddServiceCard";
import { ProviderEmptyServicesIcon } from "./ProviderIcons";
import { ProviderServiceCard } from "./ProviderServiceCard";
import type { AppointmentDetail } from "../../types/appointment";
import type { ProviderServiceDetail } from "../../types/provider";
import {
  computeProviderServiceStats,
  getProviderServiceStats,
} from "../../utils/providerPanelUtils";

type ServiceLifecycleAction = "deactivate" | "delete";

interface ProviderServicesSectionProps {
  providerId: string | null;
  services: ProviderServiceDetail[];
  appointments: AppointmentDetail[];
  isLoading: boolean;
  error: string;
  onUpdated: () => void;
}

export function ProviderServicesSection({
  providerId,
  services,
  appointments,
  isLoading,
  error,
  onUpdated,
}: ProviderServicesSectionProps) {
  const [message, setMessage] = useState("");
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [editingService, setEditingService] =
    useState<ProviderServiceDetail | null>(null);
  const [editError, setEditError] = useState("");
  const [isSavingService, setIsSavingService] = useState(false);
  const [availabilityService, setAvailabilityService] =
    useState<ProviderServiceDetail | null>(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [lifecycleAction, setLifecycleAction] =
    useState<ServiceLifecycleAction | null>(null);
  const [lifecycleService, setLifecycleService] =
    useState<ProviderServiceDetail | null>(null);
  const [lifecycleError, setLifecycleError] = useState("");
  const [isPerformingLifecycleAction, setIsPerformingLifecycleAction] =
    useState(false);
  const [isReactivatingServiceId, setIsReactivatingServiceId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  function openCreateService() {
    setEditingService(null);
    setEditError("");
    setCreateServiceOpen(true);
  }

  function closeCreateService() {
    if (isSavingService) return;
    setCreateServiceOpen(false);
    setEditError("");
  }

  function openServiceEditor(service: ProviderServiceDetail) {
    setCreateServiceOpen(false);
    setEditError("");
    setEditingService(service);
  }

  function closeServiceEditor() {
    if (isSavingService) return;
    setEditingService(null);
    setEditError("");
  }

  async function handleCreateService(
    data: Parameters<typeof createProviderService>[0]
  ) {
    setIsSavingService(true);
    setEditError("");

    try {
      await createProviderService(data);
      setCreateServiceOpen(false);
      setMessage("Service added successfully.");
      onUpdated();
    } catch (err) {
      setEditError(getErrorMessage(err, "Could not add this service."));
    } finally {
      setIsSavingService(false);
    }
  }

  async function handleSaveService(
    serviceId: string,
    data: Parameters<typeof updateProviderService>[1]
  ) {
    setIsSavingService(true);
    setEditError("");

    try {
      await updateProviderService(serviceId, data);
      setEditingService(null);
      setMessage("Service updated successfully.");
      onUpdated();
    } catch (err) {
      setEditError(getErrorMessage(err, "Could not save service changes."));
    } finally {
      setIsSavingService(false);
    }
  }

  function openAvailabilityEditor(service: ProviderServiceDetail) {
    setAvailabilityError("");
    setAvailabilityService(service);
  }

  function closeAvailabilityEditor() {
    if (isSavingAvailability) return;
    setAvailabilityService(null);
    setAvailabilityError("");
  }

  async function handleSaveAvailability(
    slots: Parameters<typeof updateProviderServiceAvailability>[1]
  ) {
    if (!availabilityService) return;

    setIsSavingAvailability(true);
    setAvailabilityError("");

    try {
      await updateProviderServiceAvailability(
        availabilityService.serviceId,
        slots
      );
      setAvailabilityService(null);
      setMessage(`Booking hours updated for ${availabilityService.serviceName}.`);
    } catch (err) {
      setAvailabilityError(
        getErrorMessage(err, "Could not save availability.")
      );
    } finally {
      setIsSavingAvailability(false);
    }
  }

  function openDeactivateDialog(service: ProviderServiceDetail) {
    setLifecycleError("");
    setLifecycleAction("deactivate");
    setLifecycleService(service);
  }

  function openDeleteDialog(service: ProviderServiceDetail) {
    setLifecycleError("");
    setLifecycleAction("delete");
    setLifecycleService(service);
  }

  async function handleReactivateService(service: ProviderServiceDetail) {
    setIsReactivatingServiceId(service.serviceId);

    try {
      await reactivateProviderService(service.serviceId);
      setLifecycleError("");
      setMessage(`${service.serviceName} is active again and visible in the catalog.`);
      onUpdated();
    } catch (err) {
      setMessage("");
      setLifecycleError(
        getErrorMessage(err, "Could not reactivate this service.")
      );
    } finally {
      setIsReactivatingServiceId(null);
    }
  }

  function closeLifecycleDialog() {
    if (isPerformingLifecycleAction) return;
    setLifecycleAction(null);
    setLifecycleService(null);
    setLifecycleError("");
  }

  async function handleConfirmLifecycleAction() {
    if (!lifecycleService || !lifecycleAction) return;

    setIsPerformingLifecycleAction(true);
    setLifecycleError("");

    try {
      if (lifecycleAction === "deactivate") {
        await deactivateProviderService(lifecycleService.serviceId);
        setMessage(`${lifecycleService.serviceName} is now inactive and hidden from the catalog.`);
      } else {
        await deleteProviderService(lifecycleService.serviceId);
        setMessage(`${lifecycleService.serviceName} was deleted.`);
      }

      setLifecycleAction(null);
      setLifecycleService(null);
      setLifecycleError("");
      onUpdated();
    } catch (err) {
      setLifecycleError(
        getErrorMessage(
          err,
          lifecycleAction === "deactivate"
            ? "Could not make this service inactive."
            : "Could not delete this service."
        )
      );
    } finally {
      setIsPerformingLifecycleAction(false);
    }
  }

  const serviceCountLabel =
    services.length === 1 ? "1 listing" : `${services.length} listings`;
  const activeServicesCount = services.filter(
    (service) => service.isActive ?? true
  ).length;
  const inactiveServicesCount = services.length - activeServicesCount;

  const serviceStatsById = useMemo(
    () => computeProviderServiceStats(appointments),
    [appointments]
  );

  return (
    <section
      id="provider-panel-services"
      role="tabpanel"
      aria-labelledby="provider-tab-services"
      className="provider-tab-panel"
    >
      <EditProviderServiceModal
        open={createServiceOpen || editingService !== null}
        mode={createServiceOpen ? "create" : "edit"}
        service={editingService}
        isSaving={isSavingService}
        error={editError}
        onCreate={handleCreateService}
        onSave={handleSaveService}
        onClose={createServiceOpen ? closeCreateService : closeServiceEditor}
      />

      <EditProviderAvailabilityModal
        open={availabilityService !== null}
        serviceId={availabilityService?.serviceId ?? null}
        serviceName={availabilityService?.serviceName ?? "this service"}
        isSaving={isSavingAvailability}
        error={availabilityError}
        onSave={handleSaveAvailability}
        onClose={closeAvailabilityEditor}
      />

      <ConfirmDialog
        open={lifecycleAction !== null && lifecycleService !== null}
        showBackdrop={false}
        title={
          lifecycleAction === "delete"
            ? "Delete service?"
            : "Make service inactive?"
        }
        confirmLabel={
          isPerformingLifecycleAction
            ? lifecycleAction === "delete"
              ? "Deleting..."
              : "Updating..."
            : lifecycleAction === "delete"
              ? "Delete service"
              : "Make inactive"
        }
        cancelLabel="Cancel"
        isConfirming={isPerformingLifecycleAction}
        onConfirm={handleConfirmLifecycleAction}
        onClose={closeLifecycleDialog}
      >
        {lifecycleService && (
          <>
            {lifecycleAction === "delete" ? (
              <p>
                This permanently removes{" "}
                <strong>{lifecycleService.serviceName}</strong> from your
                catalog. Services with appointment history or ratings cannot be
                deleted — use Make inactive instead.
              </p>
            ) : (
              <p>
                <strong>{lifecycleService.serviceName}</strong> will be hidden
                from the public catalog and customers will no longer be able to
                book it. Existing appointments are kept.
              </p>
            )}
          </>
        )}
        {lifecycleError && (
          <p className="provider-status provider-status--error" role="alert">
            {lifecycleError}
          </p>
        )}
      </ConfirmDialog>

      <header className="provider-services-header">
        <div className="provider-services-header-text">
          <h2 className="provider-services-title">Your services</h2>
          <p className="provider-services-subtitle">
            {services.length > 0
              ? inactiveServicesCount > 0
                ? `${activeServicesCount} active and ${inactiveServicesCount} inactive ${services.length === 1 ? "listing" : "listings"}. Inactive services stay here but are hidden from the public catalog.`
                : `${serviceCountLabel} in your catalog. Each service can have its own booking hours.`
              : "Add services so customers can find and book you."}
          </p>
        </div>
        <div className="provider-services-header-actions">
          <button
            type="button"
            className="provider-btn provider-btn--primary provider-services-add-btn"
            onClick={openCreateService}
          >
            + Add service
          </button>
        </div>
      </header>

      {lifecycleError && !lifecycleAction && (
        <p className="provider-status provider-status--error" role="alert">
          {lifecycleError}
        </p>
      )}

      {message && (
        <p className="provider-toast" role="status">
          {message}
        </p>
      )}

      {isLoading && (
        <div className="provider-loading provider-loading--inline" aria-live="polite">
          <SpinnerIcon className="provider-loading-spinner" />
          <p>Loading services...</p>
        </div>
      )}

      {error && !isLoading && (
        <p className="provider-status provider-status--error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && services.length === 0 && (
        <div className="provider-empty">
          <ProviderEmptyServicesIcon className="provider-empty-icon" />
          <p className="provider-empty-title">No services listed yet</p>
          <p className="provider-empty-text">
            Add your first service to start appearing in the public catalog.
          </p>
          <button
            type="button"
            className="provider-btn provider-btn--primary"
            onClick={openCreateService}
          >
            Add your first service
          </button>
        </div>
      )}

      {!isLoading && !error && services.length > 0 && providerId && (
        <ul className="provider-service-grid">
          {services.map((service, index) => (
            <ProviderServiceCard
              key={service.serviceId}
              service={service}
              providerId={providerId}
              index={index}
              stats={getProviderServiceStats(serviceStatsById, service.serviceId)}
              onEdit={openServiceEditor}
              onManageAvailability={openAvailabilityEditor}
              onDeactivate={openDeactivateDialog}
              onReactivate={handleReactivateService}
              onDelete={openDeleteDialog}
              isReactivating={isReactivatingServiceId === service.serviceId}
            />
          ))}
          <ProviderAddServiceCard
            onAdd={openCreateService}
            index={services.length}
          />
        </ul>
      )}
    </section>
  );
}
