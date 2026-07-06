import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import type { AdminUser } from "../../types/admin";
import { capitalizeFirstLetter } from "../../utils/formatDisplayName";
import {
  getDialogConfig,
  type DialogAction,
} from "./adminPanelUtils";

interface AdminUserActionDialogProps {
  action: DialogAction;
  target: AdminUser | null;
  error: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function AdminUserActionDialog({
  action,
  target,
  error,
  isSubmitting,
  onConfirm,
  onClose,
}: AdminUserActionDialogProps) {
  const { title, confirmLabel } = getDialogConfig(action);

  return (
    <ConfirmDialog
      open={action !== null && target !== null}
      title={title}
      confirmLabel={confirmLabel}
      cancelLabel="Cancel"
      isConfirming={isSubmitting}
      onConfirm={onConfirm}
      onClose={onClose}
    >
      {target && (
        <>
          {action === "delete" && (
            <p>
              This permanently removes{" "}
              <strong>{capitalizeFirstLetter(target.username)}</strong> and all
              related data. This action cannot be undone.
            </p>
          )}
          {action === "suspend" && (
            <p>
              <strong>{capitalizeFirstLetter(target.username)}</strong> will not
              be able to log in or book appointments while suspended.
            </p>
          )}
          {action === "unsuspend" && (
            <p>
              <strong>{capitalizeFirstLetter(target.username)}</strong> will
              regain full access to their account.
            </p>
          )}
        </>
      )}
      {error && (
        <p className="admin-status admin-status--error" role="alert">
          {error}
        </p>
      )}
    </ConfirmDialog>
  );
}
