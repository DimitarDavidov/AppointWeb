import { useEffect, useRef, useState, type FormEvent } from "react";
import type {
  ProviderServiceDetail,
  ProviderServiceEditFocus,
  UpdateProviderServiceRequest,
} from "../../types/provider";

export interface EditProviderServiceModalProps {
  service: ProviderServiceDetail | null;
  focusField?: ProviderServiceEditFocus;
  isSaving: boolean;
  error: string;
  onSave: (serviceId: string, data: UpdateProviderServiceRequest) => void;
  onClose: () => void;
}

const focusLabels: Record<ProviderServiceEditFocus, string> = {
  title: "Edit service title",
  description: "Edit description",
  price: "Edit price",
  duration: "Edit duration",
  category: "Edit category",
};

function EditProviderServiceModal({
  service,
  focusField = "title",
  isSaving,
  error,
  onSave,
  onClose,
}: EditProviderServiceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [price, setPrice] = useState("");
  const [validationError, setValidationError] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!service) return;

    setName(service.serviceName);
    setDescription(service.description ?? "");
    setCategory(service.category ?? "");
    setCountry(service.country);
    setCity(service.city);
    setDurationMinutes(String(service.durationMinutes));
    setPrice(String(service.price));
    setValidationError("");
  }, [service]);

  useEffect(() => {
    if (!service) return;

    const focusMap = {
      title: nameRef,
      description: descriptionRef,
      category: categoryRef,
      duration: durationRef,
      price: priceRef,
    } as const;

    const target = focusMap[focusField]?.current;
    if (!target) return;

    target.focus();
    if ("select" in target && typeof target.select === "function") {
      target.select();
    }
  }, [service, focusField]);

  useEffect(() => {
    if (!service) return;

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
  }, [service, isSaving, onClose]);

  if (!service) {
    return null;
  }

  const serviceId = service.serviceId;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    const parsedDuration = Number(durationMinutes);
    const parsedPrice = Number(price);

    if (trimmedName.length < 2) {
      setValidationError("Title must be at least 2 characters.");
      return;
    }

    const trimmedCountry = country.trim();
    const trimmedCity = city.trim();

    if (!trimmedCountry) {
      setValidationError("Country is required.");
      return;
    }

    if (!trimmedCity) {
      setValidationError("City is required.");
      return;
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
    onSave(serviceId, {
      name: trimmedName,
      description: description.trim() || null,
      category: category.trim() || null,
      country: trimmedCountry,
      city: trimmedCity,
      durationMinutes: parsedDuration,
      price: parsedPrice,
    });
  }

  const displayError = validationError || error;

  return (
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
            {focusLabels[focusField]}
          </h2>
          <p className="provider-modal-subtitle">
            Update how <strong>{service.serviceName}</strong> appears in your
            catalog.
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
            <input
              ref={categoryRef}
              id="provider-service-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSaving}
              maxLength={100}
              placeholder="Optional"
            />
          </div>

          <div className="provider-modal-field-row">
            <div className="provider-modal-field">
              <label htmlFor="provider-service-country">Country</label>
              <input
                ref={countryRef}
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
                ref={cityRef}
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

          <div className="provider-modal-field">
            <label htmlFor="provider-service-description">Description</label>
            <textarea
              ref={descriptionRef}
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
                ref={durationRef}
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
                ref={priceRef}
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
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProviderServiceModal;
