import type { ReactNode } from "react";
import { EditIcon, SpinnerIcon } from "./AccountIcons";

export type FieldVariant = "email" | "username" | "password" | "phone";

interface AccountFieldProps {
  variant: FieldVariant;
  label: string;
  value: string;
  icon: ReactNode;
  index: number;
  masked?: boolean;
  empty?: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  editForm: ReactNode;
}

export function AccountField({
  variant,
  label,
  value,
  icon,
  index,
  masked,
  empty,
  isEditing,
  onEdit,
  onCancel,
  editForm,
}: AccountFieldProps) {
  return (
    <div
      className={`account-field account-field--${variant}${isEditing ? " account-field--editing" : ""}`}
      style={{ animationDelay: `${0.08 + index * 0.07}s` }}
    >
      <div className="account-field-row">
        <div className="account-field-icon-wrap">{icon}</div>
        <div className="account-field-body">
          <span className="account-field-label">{label}</span>
          {!isEditing && (
            <span
              className={`account-field-value${masked ? " account-field-value--masked" : ""}${empty ? " account-field-value--empty" : ""}`}
            >
              {value}
            </span>
          )}
        </div>
        {!isEditing && (
          <button
            type="button"
            className="account-field-change"
            onClick={onEdit}
          >
            <EditIcon />
            Change
          </button>
        )}
      </div>

      {isEditing && (
        <div className="account-field-edit">
          {editForm}
          <div className="account-field-actions">
            <button
              type="button"
              className="account-field-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface InputWithIconProps {
  id: string;
  type: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
}

export function InputWithIcon({
  id,
  type,
  icon,
  value,
  onChange,
  disabled,
  placeholder,
  required,
  minLength,
  maxLength,
  autoComplete,
}: InputWithIconProps) {
  return (
    <div className="account-field-input-wrap">
      {icon}
      <input
        id={id}
        className="account-field-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
      />
    </div>
  );
}

export function SaveButton({
  isSaving,
  label = "Save",
}: {
  isSaving: boolean;
  label?: string;
}) {
  return (
    <button type="submit" className="account-field-save" disabled={isSaving}>
      {isSaving ? (
        <>
          <SpinnerIcon className="account-field-spinner" />
          Saving...
        </>
      ) : (
        label
      )}
    </button>
  );
}
