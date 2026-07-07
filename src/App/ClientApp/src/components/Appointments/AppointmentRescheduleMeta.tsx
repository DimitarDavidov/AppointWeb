import type { AppointmentDetail } from "../../types/appointment";
import {
  getPreviousRescheduleTimeLabel,
  getReschedulePartyCountLabel,
} from "../../utils/appointmentRescheduleUtils";
import { ProviderRescheduleIcon } from "../Provider/ProviderIcons";

type AppointmentRescheduleMetaVariant = "provider" | "appointments";

interface AppointmentRescheduleMetaProps {
  appointment: AppointmentDetail;
  variant?: AppointmentRescheduleMetaVariant;
}

interface RescheduleMetaItemProps {
  variant: AppointmentRescheduleMetaVariant;
  label: string;
  value: string;
}

function RescheduleMetaItem({
  variant,
  label,
  value,
}: RescheduleMetaItemProps) {
  const itemClassName =
    variant === "provider"
      ? "provider-appointment-meta-item"
      : "appointments-card-meta-item appointments-card-meta-item--with-icon";

  return (
    <div className={itemClassName}>
      <dt>
        <ProviderRescheduleIcon />
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

export function AppointmentRescheduleMeta({
  appointment,
  variant = "provider",
}: AppointmentRescheduleMetaProps) {
  return (
    <>
      <RescheduleMetaItem
        variant={variant}
        label="Rescheduled by provider"
        value={getReschedulePartyCountLabel(
          appointment.providerRescheduleCount ?? 0
        )}
      />
      <RescheduleMetaItem
        variant={variant}
        label="Rescheduled by customer"
        value={getReschedulePartyCountLabel(
          appointment.customerRescheduleCount ?? 0
        )}
      />
      <RescheduleMetaItem
        variant={variant}
        label="Previous time"
        value={getPreviousRescheduleTimeLabel(appointment.previousStartTime)}
      />
    </>
  );
}
