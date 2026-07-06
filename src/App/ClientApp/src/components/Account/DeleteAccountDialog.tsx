import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import { UserRoles } from "../../constants/roles";

interface DeleteAccountDialogProps {
  open: boolean;
  role: string | null;
  password: string;
  error: string;
  isDeleting: boolean;
  onPasswordChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteAccountDialog({
  open,
  role,
  password,
  error,
  isDeleting,
  onPasswordChange,
  onConfirm,
  onClose,
}: DeleteAccountDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Delete your account?"
      confirmLabel="Delete my account"
      cancelLabel="Keep my account"
      isConfirming={isDeleting}
      onConfirm={onConfirm}
      onClose={onClose}
    >
      <p>
        This permanently removes your account and all related data, including
        appointments
        {role === UserRoles.Provider ? ", service offerings, and availability" : ""}.
        This action cannot be undone.
      </p>
      <label className="account-delete-password" htmlFor="delete-account-password">
        Confirm with your password
        <input
          id="delete-account-password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          autoComplete="current-password"
          disabled={isDeleting}
          placeholder="Your password"
        />
      </label>
      {error && (
        <p className="account-delete-error" role="alert">
          {error}
        </p>
      )}
    </ConfirmDialog>
  );
}
