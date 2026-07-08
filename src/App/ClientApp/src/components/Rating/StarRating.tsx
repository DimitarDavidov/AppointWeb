import { useState } from "react";
import "./StarRating.scss";

type StarSize = "sm" | "md" | "lg";

function fillPercent(display: number, index: number): string {
  if (display >= index) return "100%";
  if (display >= index - 0.5) return "50%";
  return "0%";
}

interface StarRatingDisplayProps {
  value: number | null;
  size?: StarSize;
  showValue?: boolean;
  count?: number | null;
}

export function StarRatingDisplay({
  value,
  size = "md",
  showValue = false,
  count = null,
}: StarRatingDisplayProps) {
  const clamped = value == null ? 0 : Math.max(0, Math.min(5, value));
  const label = value == null ? "Not yet rated" : `Rated ${value} out of 5`;

  return (
    <span className={`star-rating star-rating--${size}`}>
      <span className="star-rating-track" role="img" aria-label={label}>
        <span className="star-rating-empty" aria-hidden="true">
          ★★★★★
        </span>
        <span
          className="star-rating-fill"
          style={{ width: `${(clamped / 5) * 100}%` }}
          aria-hidden="true"
        >
          ★★★★★
        </span>
      </span>
      {showValue && (
        <span className="star-rating-value">
          {value == null ? "No rating" : value.toFixed(1)}
          {count != null && count > 0 && (
            <span className="star-rating-count">
              {" "}
              ({count})
            </span>
          )}
        </span>
      )}
    </span>
  );
}

interface StarRatingInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  allowClear?: boolean;
}

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  allowClear = true,
}: StarRatingInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;

  return (
    <div className="star-input" role="radiogroup" aria-label="Star rating">
      <div className="star-input-stars" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((index) => {
          const half = index - 0.5;
          return (
            <span className="star-input-star" key={index}>
              <span className="star-input-glyph">
                <span className="star-input-glyph-empty" aria-hidden="true">
                  ★
                </span>
                <span
                  className="star-input-glyph-fill"
                  style={{ width: fillPercent(display, index) }}
                  aria-hidden="true"
                >
                  ★
                </span>
              </span>
              <button
                type="button"
                className="star-input-half star-input-half--left"
                aria-label={`${half} stars`}
                aria-pressed={value === half}
                disabled={disabled}
                onMouseEnter={() => setHover(half)}
                onFocus={() => setHover(half)}
                onBlur={() => setHover(null)}
                onClick={() => onChange(half)}
              />
              <button
                type="button"
                className="star-input-half star-input-half--right"
                aria-label={`${index} stars`}
                aria-pressed={value === index}
                disabled={disabled}
                onMouseEnter={() => setHover(index)}
                onFocus={() => setHover(index)}
                onBlur={() => setHover(null)}
                onClick={() => onChange(index)}
              />
            </span>
          );
        })}
      </div>

      <span className="star-input-value">
        {display > 0 ? `${display.toFixed(1)} / 5` : "No stars"}
      </span>

      {allowClear && value != null && (
        <button
          type="button"
          className="star-input-clear"
          disabled={disabled}
          onClick={() => onChange(null)}
        >
          Clear
        </button>
      )}
    </div>
  );
}
