import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { SERVICE_CATEGORIES, isServiceCategory } from "../../constants/serviceCategories";
import type {
  ProviderServiceDetail,
  UpdateProviderServiceRequest,
} from "../../types/provider";

export interface EditProviderServiceModalProps {
  open: boolean;
  mode: "create" | "edit";
  service: ProviderServiceDetail | null;
  isSaving: boolean;
  error: string;
  onSave: (serviceId: string, data: UpdateProviderServiceRequest) => void;
  onCreate: (data: UpdateProviderServiceRequest) => void;
  onClose: () => void;
}

function EditProviderServiceModal({
  open,
  mode,
  service,
  isSaving,
  error,
  onSave,
  onCreate,
  onClose,
}: EditProviderServiceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [price, setPrice] = useState("");
  const [validationError, setValidationError] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    if (mode === "create") {
      setName("");
      setDescription("");
      setCategory("");
      setIsRemote(false);
      setCountry("");
      setCity("");
      setDurationMinutes("30");
      setPrice("");
      setValidationError("");
      return;
    }

    if (!service) return;

    setName(service.serviceName);
    setDescription(service.description ?? "");
    setCategory(
      service.category && isServiceCategory(service.category) ? service.category : ""
    );
    setIsRemote(service.isRemote);
    setCountry(service.country);
    setCity(service.city);
    setDurationMinutes(String(service.durationMinutes));
    setPrice(String(service.price));
    setValidationError("");
  }, [open, mode, service]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => nameRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, mode, service]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, isSaving, onClose]);

  if (!open) {
    return null;
  }

  const isCreate = mode === "create";
  const serviceId = service?.serviceId ?? "";

  function handleRemoteChange(checked: boolean) {
    setIsRemote(checked);

    if (checked) {
      setCountry("");
      setCity("");
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    const parsedDuration = Number(durationMinutes);
    const parsedPrice = Number(price);

    if (trimmedName.length < 2) {
      setValidationError("Title must be at least 2 characters.");
      return;
    }

    if (!isServiceCategory(category)) {
      setValidationError("Please select a category.");
      return;
    }

    const trimmedCountry = country.trim();
    const trimmedCity = city.trim();

    if (!isRemote) {
      if (!trimmedCountry) {
        setValidationError("Country is required for in-person services.");
        return;
      }

      if (!trimmedCity) {
        setValidationError("City is required for in-person services.");
        return;
      }
    }

    if (!Number.isFinite(parsedDuration) || parsedDuration < 1) {
      setValidationError("Duration must be at least 1 minute.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setValidationError("Price must be zero or greater.");
      return;
    }

    setValidationError("");
    const payload = {
      name: trimmedName,
      description: description.trim() || null,
      category,
      isRemote,
      country: isRemote ? "" : trimmedCountry,
      city: isRemote ? "" : trimmedCity,
      durationMinutes: parsedDuration,
      price: parsedPrice,
    };

    if (isCreate) {
      onCreate(payload);
      return;
    }

    onSave(serviceId, payload);
  }

  const displayError = validationError || error;

  return createPortal(
    <div className="provider-modal-root" role="presentation">
      <button
        type="button"
        className="provider-modal-backdrop"
        aria-label="Close editor"
        disabled={isSaving}
        onClick={onClose}
      />

      <div
        className="provider-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-provider-service-title"
      >
        <header className="provider-modal-header">
          <h2 id="edit-provider-service-title" className="provider-modal-title">
            {isCreate ? "Add new service" : "Edit service"}
          </h2>
          <p className="provider-modal-subtitle">
            {isCreate ? (
              "Create a service listing that customers can browse and book."
            ) : (
              <>
                Update all details for <strong>{service?.serviceName}</strong> in
                one place.
              </>
            )}
          </p>
        </header>

        <form className="provider-modal-form" onSubmit={handleSubmit}>
          <div className="provider-modal-field">
            <label htmlFor="provider-service-name">Title</label>
            <input
              ref={nameRef}
              id="provider-service-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
              required
              minLength={2}
              maxLength={200}
            />
          </div>

          <div className="provider-modal-field">
            <label htmlFor="provider-service-category">Category</label>
            <select
              id="provider-service-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSaving}
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              {SERVICE_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="provider-modal-field">
            <label className="provider-modal-checkbox" htmlFor="provider-service-remote">
              <input
                id="provider-service-remote"
                type="checkbox"
                checked={isRemote}
                onChange={(e) => handleRemoteChange(e.target.checked)}
                disabled={isSaving}
              />
              <span>This service is offered remotely</span>
            </label>
            <p className="provider-modal-field-hint">
              {isRemote
                ? "Customers will see this service as remote. City and country are not required."
                : "Uncheck to require a city and country for in-person services."}
            </p>
          </div>

          {!isRemote && (
            <div className="provider-modal-field-row">
              <div className="provider-modal-field">
                <label htmlFor="provider-service-country">Country</label>
                <input
                  id="provider-service-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={isSaving}
                  required
                  maxLength={100}
                />
              </div>

              <div className="provider-modal-field">
                <label htmlFor="provider-service-city">City</label>
                <input
                  id="provider-service-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isSaving}
                  required
                  maxLength={100}
                />
              </div>
            </div>
          )}

          <div className="provider-modal-field">
            <label htmlFor="provider-service-description">Description</label>
            <textarea
              id="provider-service-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              maxLength={1000}
              rows={4}
              placeholder="Describe what customers should expect"
            />
          </div>

          <div className="provider-modal-field-row">
            <div className="provider-modal-field">
              <label htmlFor="provider-service-duration">Duration (minutes)</label>
              <input
                id="provider-service-duration"
                type="number"
                min={1}
                max={1440}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            <div className="provider-modal-field">
              <label htmlFor="provider-service-price">Price</label>
              <input
                id="provider-service-price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>
          </div>

          {displayError && (
            <p className="provider-modal-error" role="alert">
              {displayError}
            </p>
          )}

          <div className="provider-modal-actions">
            <button
              type="button"
              className="provider-modal-btn provider-modal-btn-secondary"
              disabled={isSaving}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="provider-modal-btn provider-modal-btn-primary"
              disabled={isSaving}
            >
              {isSaving
                ? isCreate
                  ? "Adding..."
                  : "Saving..."
                : isCreate
                  ? "Add service"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default EditProviderServiceModal;
