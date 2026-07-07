import { useEffect, useState, type ReactNode } from "react";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import "./CancelAppointmentDialog.scss";

interface CancelAppointmentDialogProps {
  open: boolean;
  isConfirming: boolean;
  showReasonField?: boolean;
  reasonAudience?: "customer" | "provider";
  onConfirm: (reason?: string) => void;
  onClose: () => void;
  children: ReactNode;
}

export function CancelAppointmentDialog({
  open,
  isConfirming,
  showReasonField = false,
  reasonAudience = "customer",
  onConfirm,
  onClose,
  children,
}: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  function handleClose() {
    if (isConfirming) return;
    onClose();
  }

  function handleConfirm() {
    const trimmedReason = reason.trim();
    onConfirm(trimmedReason || undefined);
  }

  const reasonPlaceholder =
    reasonAudience === "provider"
      ? "Let the provider know why you are cancelling..."
      : "Let the customer know why this appointment is being cancelled...";

  const reasonHint =
    reasonAudience === "provider"
      ? "Your provider will receive an email about this cancellation. Any reason you add will be included."
      : "The customer will receive an email about this cancellation. Any reason you add will be included.";

  return (
    <ConfirmDialog
      open={open}
      title="Cancel appointment?"
      confirmLabel="Yes, cancel appointment"
      cancelLabel="Keep appointment"
      isConfirming={isConfirming}
      onConfirm={handleConfirm}
      onClose={handleClose}
    >
      {children}

      {showReasonField && (
        <label className="cancel-appointment-reason" htmlFor="cancel-reason">
          Reason for cancellation
          <span className="cancel-appointment-reason-optional">(optional)</span>
          <textarea
            id="cancel-reason"
            className="cancel-appointment-reason-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={reasonPlaceholder}
            rows={4}
            maxLength={1000}
            disabled={isConfirming}
          />
          <span className="cancel-appointment-reason-hint">{reasonHint}</span>
        </label>
      )}
    </ConfirmDialog>
  );
}
