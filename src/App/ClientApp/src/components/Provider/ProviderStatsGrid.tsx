import type { ProviderStats } from "../../utils/providerPanelUtils";
import {
  ProviderStatBookedIcon,
  ProviderStatServicesIcon,
  ProviderStatTodayIcon,
  ProviderStatUpcomingIcon,
} from "./ProviderIcons";

interface ProviderStatsGridProps {
  stats: ProviderStats;
}

const statCards = [
  {
    key: "upcoming",
    label: "Upcoming",
    hint: "Scheduled ahead",
    icon: ProviderStatUpcomingIcon,
    modifier: "provider-stat-card--upcoming",
  },
  {
    key: "today",
    label: "Today",
    hint: "Happening today",
    icon: ProviderStatTodayIcon,
    modifier: "provider-stat-card--today",
  },
  {
    key: "pending",
    label: "Pending",
    hint: "Awaiting confirmation",
    icon: ProviderStatBookedIcon,
    modifier: "provider-stat-card--pending",
  },
  {
    key: "services",
    label: "Listed services",
    hint: "On your catalog",
    icon: ProviderStatServicesIcon,
    modifier: "provider-stat-card--services",
  },
] as const;

export function ProviderStatsGrid({ stats }: ProviderStatsGridProps) {
  const values = {
    upcoming: stats.upcoming,
    today: stats.today,
    pending: stats.pending,
    services: stats.services,
  };

  return (
    <div className="provider-stat-grid" aria-label="Provider statistics">
      {statCards.map((card, index) => {
        const Icon = card.icon;

        return (
          <article
            key={card.key}
            className={`provider-stat-card ${card.modifier}`}
            style={{ animationDelay: `${0.05 + index * 0.06}s` }}
          >
            <span className="provider-stat-card-icon" aria-hidden="true">
              <Icon />
            </span>
            <div className="provider-stat-card-body">
              <span className="provider-stat-card-value">
                {values[card.key]}
              </span>
              <span className="provider-stat-card-label">{card.label}</span>
              <span className="provider-stat-card-hint">{card.hint}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
