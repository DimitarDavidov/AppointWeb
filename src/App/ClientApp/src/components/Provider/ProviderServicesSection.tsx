import { useEffect, useState } from "react";
import {
  createProviderService,
  updateProviderAvailability,
  updateProviderService,
} from "../../api/provider";
import { getErrorMessage } from "../../api/errors";
import { SpinnerIcon } from "../Account/AccountIcons";
import EditProviderAvailabilityModal from "./EditProviderAvailabilityModal";
import EditProviderServiceModal from "./EditProviderServiceModal";
import { ProviderEmptyServicesIcon } from "./ProviderIcons";
import { ProviderServiceCard } from "./ProviderServiceCard";
import type {
  ProviderServiceDetail,
  ProviderServiceEditFocus,
} from "../../types/provider";

interface ProviderServicesSectionProps {
  providerId: string | null;
  services: ProviderServiceDetail[];
  isLoading: boolean;
  error: string;
  onUpdated: () => void;
}

export function ProviderServicesSection({
  providerId,
  services,
  isLoading,
  error,
  onUpdated,
}: ProviderServicesSectionProps) {
  const [message, setMessage] = useState("");
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [editingService, setEditingService] =
    useState<ProviderServiceDetail | null>(null);
  const [editFocus, setEditFocus] = useState<ProviderServiceEditFocus>("title");
  const [editError, setEditError] = useState("");
  const [isSavingService, setIsSavingService] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

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

  function openServiceEditor(
    service: ProviderServiceDetail,
    focus: ProviderServiceEditFocus
  ) {
    setCreateServiceOpen(false);
    setEditError("");
    setEditFocus(focus);
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

  function openAvailabilityEditor() {
    setAvailabilityError("");
    setAvailabilityOpen(true);
  }

  function closeAvailabilityEditor() {
    if (isSavingAvailability) return;
    setAvailabilityOpen(false);
    setAvailabilityError("");
  }

  async function handleSaveAvailability(
    slots: Parameters<typeof updateProviderAvailability>[0]
  ) {
    setIsSavingAvailability(true);
    setAvailabilityError("");

    try {
      await updateProviderAvailability(slots);
      setAvailabilityOpen(false);
      setMessage("Availability updated successfully.");
    } catch (err) {
      setAvailabilityError(
        getErrorMessage(err, "Could not save availability.")
      );
    } finally {
      setIsSavingAvailability(false);
    }
  }

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
        focusField={editFocus}
        isSaving={isSavingService}
        error={editError}
        onCreate={handleCreateService}
        onSave={handleSaveService}
        onClose={createServiceOpen ? closeCreateService : closeServiceEditor}
      />

      <EditProviderAvailabilityModal
        open={availabilityOpen}
        isSaving={isSavingAvailability}
        error={availabilityError}
        onSave={handleSaveAvailability}
        onClose={closeAvailabilityEditor}
      />

      <div className="provider-services-toolbar">
        <div className="provider-tab-panel-intro provider-services-intro">
          <p>
            Update how each service appears in your catalog, adjust pricing and
            duration, and manage the hours customers can book you.
          </p>
        </div>
        <button
          type="button"
          className="provider-btn provider-btn--primary provider-services-add-btn"
          onClick={openCreateService}
        >
          Add service
        </button>
      </div>

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
            Add service
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
              onEdit={openServiceEditor}
              onManageAvailability={openAvailabilityEditor}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
