import type { ProviderStats } from "../../utils/providerPanelUtils";
import {
  ProviderStatBookedIcon,
  ProviderStatServicesIcon,
  ProviderStatTodayIcon,
  ProviderStatUpcomingIcon,
} from "./ProviderIcons";

export type ProviderStatCardKey = "upcoming" | "today" | "pending" | "services";

interface ProviderStatsGridProps {
  stats: ProviderStats;
  activeStat?: ProviderStatCardKey | null;
  onStatClick?: (key: ProviderStatCardKey) => void;
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
] as const satisfies ReadonlyArray<{
  key: ProviderStatCardKey;
  label: string;
  hint: string;
  icon: typeof ProviderStatUpcomingIcon;
  modifier: string;
}>;

export function ProviderStatsGrid({
  stats,
  activeStat = null,
  onStatClick,
}: ProviderStatsGridProps) {
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
        const isActive = activeStat === card.key;
        const isClickable = !!onStatClick;

        if (isClickable) {
          return (
            <button
              key={card.key}
              type="button"
              className={`provider-stat-card provider-stat-card--button ${card.modifier}${
                isActive ? " provider-stat-card--active" : ""
              }`}
              style={{ animationDelay: `${0.05 + index * 0.06}s` }}
              aria-pressed={isActive}
              onClick={() => onStatClick(card.key)}
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
            </button>
          );
        }

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
