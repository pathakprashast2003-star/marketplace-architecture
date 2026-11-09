"use client";

import * as React from "react";
import { ArrowUpRight, Check } from "lucide-react";

export type UsagePricingPlan = {
  id: string;
  name: string;
  basePrice: number;
  perSeat?: number;
  includedSeats?: number;
  /** Graduated rates for billable seats after includedSeats. The final rate continues. */
  seatTiers?: { upTo: number; perSeat: number }[];
  includedRequests?: number;
  requestsPerSeat?: number;
  includedStorage?: number;
  storagePerSeat?: number;
  /** Charged for each started block of 1,000 requests beyond the included quota. */
  overagePer1k?: number;
  maxSeats?: number;
  maxRequests?: number;
  highlights?: string[];
};

export type UsagePricingAxis = {
  key: "seats" | "requests";
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  label?: string;
};

export type UsagePricingQuote = {
  seats: number;
  requests: number;
  price: number;
  includedRequests: number;
  includedStorage: number;
  eligible: boolean;
};

export type UsagePricingMetric = {
  amount: number;
  unit?: string;
  format?: (value: number) => string;
};
export type UsagePricingRow = {
  label: string;
  values: (
    plan: UsagePricingPlan,
    quote: UsagePricingQuote,
  ) => React.ReactNode | UsagePricingMetric;
};

export type UsageSliderPricingTableProps = {
  plans: UsagePricingPlan[];
  rows?: UsagePricingRow[];
  axis?: UsagePricingAxis;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Optional simultaneous second slider; must use the opposite key. */
  secondaryAxis?: UsagePricingAxis;
  secondaryValue?: number;
  defaultSecondaryValue?: number;
  onSecondaryValueChange?: (value: number) => void;
  /** Fixed usage for an axis that is not currently controlled by a slider. */
  usage?: { seats?: number; requests?: number };
  /** Return an eligible plan ID. Unknown or ineligible results use the default recommendation. */
  recommend?: (plans: UsagePricingPlan[], value: number, quotes: UsagePricingQuote[]) => string;
  onSelect?: (planId: string) => void;
  onInteractionStart?: () => void;
  currency?: string;
  locale?: string;
  className?: string;
  ref?: React.ComponentProps<"div">["ref"];
};

const DEFAULT_AXIS: UsagePricingAxis = {
  key: "seats",
  min: 1,
  max: 100,
  step: 1,
};
const DEFAULT_ROWS: UsagePricingRow[] = [
  {
    label: "Included requests",
    values: (_, quote) => quote.includedRequests,
  },
  {
    label: "Pooled storage",
    values: (_, quote) => ({ amount: quote.includedStorage, unit: "GB" }),
  },
];
const DIGITS = Array.from({ length: 10 }, (_, index) => index);
const usageUnit = (key: UsagePricingAxis["key"], value: number) =>
  key === "seats" && value === 1 ? "seat" : key;
const nonnegative = (value: number | undefined) => Math.max(0, Number.isFinite(value) ? value! : 0);

/** Pure monthly estimate, in currency units. Request overage rounds UP to a 1k block. */
export function quoteUsagePlan(
  plan: UsagePricingPlan,
  usage: { seats: number; requests: number },
): UsagePricingQuote {
  const seats = nonnegative(usage.seats);
  const requests = nonnegative(usage.requests);
  const billableSeats = Math.max(0, seats - nonnegative(plan.includedSeats));
  let seatPrice = billableSeats * nonnegative(plan.perSeat);
  if (plan.seatTiers?.length) {
    let boundary = 0;
    seatPrice = 0;
    const tiers = [...plan.seatTiers].sort((a, b) => a.upTo - b.upTo);
    for (const tier of tiers) {
      const end = Math.max(boundary, tier.upTo);
      seatPrice += Math.max(0, Math.min(billableSeats, end) - boundary) * nonnegative(tier.perSeat);
      boundary = end;
    }
    seatPrice +=
      Math.max(0, billableSeats - boundary) * nonnegative(tiers[tiers.length - 1]?.perSeat);
  }
  const includedRequests =
    nonnegative(plan.includedRequests) + seats * nonnegative(plan.requestsPerSeat);
  const extraRequests = Math.max(0, requests - includedRequests);
  const requestPrice = Math.ceil(extraRequests / 1000) * nonnegative(plan.overagePer1k);
  const eligible =
    (plan.maxSeats === undefined || seats <= plan.maxSeats) &&
    (plan.maxRequests === undefined || requests <= plan.maxRequests) &&
    (extraRequests === 0 || plan.overagePer1k !== undefined);
  return {
    seats,
    requests,
    price: Math.round((nonnegative(plan.basePrice) + seatPrice + requestPrice) * 100) / 100,
    includedRequests,
    includedStorage: nonnegative(plan.includedStorage) + seats * nonnegative(plan.storagePerSeat),
    eligible,
  };
}

function normalizeAxis(axis: UsagePricingAxis): UsagePricingAxis {
  const min = nonnegative(axis.min);
  return {
    ...axis,
    min,
    max: Math.max(min, nonnegative(axis.max)),
    step: axis.step > 0 && Number.isFinite(axis.step) ? axis.step : 1,
  };
}

function clampValue(value: number, axis: UsagePricingAxis) {
  const safe = Number.isFinite(value) ? value : axis.min;
  const stepped = axis.min + Math.round((safe - axis.min) / axis.step) * axis.step;
  return Math.min(axis.max, Math.max(axis.min, Number(stepped.toFixed(6))));
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(true);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function Count({
  amount,
  unit,
  format,
  reduced,
  locale,
}: UsagePricingMetric & { reduced: boolean; locale: string }) {
  const [display, setDisplay] = React.useState(amount);
  const current = React.useRef(amount);
  React.useEffect(() => {
    if (reduced) {
      current.current = amount;
      setDisplay(amount);
      return;
    }
    const from = current.current;
    if (from === amount) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - start) / 320));
      current.current = from + (amount - from) * (1 - (1 - progress) ** 3);
      setDisplay(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [amount, reduced]);
  const render = (number: number) =>
    format?.(number) ?? new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(number);
  return (
    <span data-count-target={amount} className="tabular-nums">
      <span className="sr-only">
        {render(amount)}
        {unit && ` ${unit}`}
      </span>
      <span aria-hidden="true" data-count-value={reduced ? amount : display}>
        {render(reduced ? amount : display)}
        {unit && <span className="ml-1 text-[10px] text-muted-foreground">{unit}</span>}
      </span>
    </span>
  );
}

function RollingPrice({
  value,
  format,
  reduced,
}: {
  value: number;
  format: (value: number) => string;
  reduced: boolean;
}) {
  const text = format(value);
  return (
    <span
      data-price={value}
      className="inline-flex items-baseline whitespace-nowrap font-semibold tabular-nums tracking-tight"
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {Array.from(text).map((character, index) =>
          /\d/.test(character) ? (
            <span
              key={text.length - index}
              className="relative inline-block h-[1em] w-[0.62em] overflow-hidden"
            >
              <span
                data-digit
                style={{
                  transform: `translateY(-${Number(character)}em)`,
                  transition: reduced ? "none" : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                className="block"
              >
                {DIGITS.map((digit) => (
                  <span key={digit} className="block h-[1em] text-center leading-none">
                    {digit}
                  </span>
                ))}
              </span>
            </span>
          ) : (
            <span key={text.length - index} className="leading-none">
              {character}
            </span>
          ),
        )}
      </span>
    </span>
  );
}

function UsageSlider({
  axis,
  value,
  onChange,
  onInteraction,
}: {
  axis: UsagePricingAxis;
  value: number;
  onChange: (value: number) => void;
  onInteraction?: () => void;
}) {
  const id = React.useId();
  const fraction = axis.max === axis.min ? 0 : (value - axis.min) / (axis.max - axis.min);
  const format = axis.format ?? ((number: number) => number.toLocaleString("en-US"));
  const label = axis.label ?? (axis.key === "seats" ? "Team size" : "Monthly requests");
  const left = `calc(${fraction * 100}% + ${10 - fraction * 20}px)`;
  return (
    <div className="mx-auto min-w-0 max-w-[660px]" data-usage-axis={axis.key}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[11px] font-semibold tracking-[0.08em] uppercase">
          {label}
        </label>
        <span className="text-[11px] text-muted-foreground">
          {axis.key === "seats" ? "Drag to find your fit" : "Estimate your volume"}
        </span>
      </div>
      <div className="relative h-[76px]">
        <div
          aria-hidden="true"
          data-thumb-tooltip
          style={{ left }}
          className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/25 bg-card px-3 py-1 text-xs font-semibold tabular-nums text-primary shadow-[0_5px_18px_rgba(55,80,190,0.12)]"
        >
          {format(value)}
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-[10px] top-[50px] h-5 opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, color-mix(in oklab, var(--color-muted-foreground) 42%, transparent) 0 1px, transparent 1px 7px)",
            maskImage:
              "linear-gradient(to bottom, transparent 0 5px, black 5px 13px, transparent 13px)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-[10px] top-[56px] h-1 rounded-full bg-border"
        >
          <div
            style={{ width: `${fraction * 100}%` }}
            className="h-full rounded-full bg-primary transition-[width] duration-150 motion-reduce:transition-none"
          />
        </div>
        <input
          id={id}
          type="range"
          data-usage-slider={axis.key}
          min={axis.min}
          max={axis.max}
          step={axis.step}
          value={value}
          aria-valuetext={`${format(value)} ${usageUnit(axis.key, value)}`}
          disabled={axis.max === axis.min}
          onPointerDown={onInteraction}
          onKeyDown={onInteraction}
          onFocus={onInteraction}
          onChange={(event) => onChange(clampValue(Number(event.target.value), axis))}
          className="absolute inset-x-0 top-[42px] h-8 w-full cursor-ew-resize appearance-none rounded-md bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-default [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[7px] [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-card [&::-webkit-slider-thumb]:shadow-[0_3px_10px_rgba(55,80,190,0.28)] [&::-moz-range-thumb]:h-[10px] [&::-moz-range-thumb]:w-[10px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[7px] [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-card"
        />
      </div>
      <div
        aria-hidden="true"
        className="flex justify-between px-1 text-[11px] tabular-nums text-muted-foreground"
      >
        <span>
          {format(axis.min)} {usageUnit(axis.key, axis.min)}
        </span>
        <span>
          {format(axis.max)} {usageUnit(axis.key, axis.max)}
        </span>
      </div>
    </div>
  );
}

/** Reusable calculator: no autoplay, demo simulation, or network requests. */
export function UsageSliderPricingTable({
  plans,
  rows = DEFAULT_ROWS,
  axis: axisProp = DEFAULT_AXIS,
  value,
  defaultValue,
  onValueChange,
  secondaryAxis: secondaryProp,
  secondaryValue,
  defaultSecondaryValue,
  onSecondaryValueChange,
  usage = {},
  recommend,
  onSelect,
  onInteractionStart,
  currency = "USD",
  locale = "en-US",
  className = "",
  ref,
}: UsageSliderPricingTableProps) {
  const axis = normalizeAxis(axisProp);
  const secondary =
    secondaryProp && secondaryProp.key !== axis.key ? normalizeAxis(secondaryProp) : undefined;
  const [localValue, setLocalValue] = React.useState(defaultValue ?? axis.min);
  const [localSecondary, setLocalSecondary] = React.useState(
    defaultSecondaryValue ?? secondary?.min ?? 0,
  );
  const actual = clampValue(value ?? localValue, axis);
  const second = secondary ? clampValue(secondaryValue ?? localSecondary, secondary) : 0;
  const reduced = useReducedMotion();
  const headingId = React.useId();
  const usageValues = {
    seats: usage.seats ?? 1,
    requests: usage.requests ?? 0,
    [axis.key]: actual,
    ...(secondary ? { [secondary.key]: second } : {}),
  };
  const quotes = plans.map((plan) => quoteUsagePlan(plan, usageValues));
  let cheapest = -1;
  quotes.forEach((quote, index) => {
    if (quote.eligible && (cheapest < 0 || quote.price < quotes[cheapest]!.price)) cheapest = index;
  });
  const customId = recommend?.(plans, actual, quotes);
  const customIndex = plans.findIndex(
    (plan, index) => plan.id === customId && quotes[index]!.eligible,
  );
  const recommended = customIndex >= 0 ? customIndex : cheapest;
  const activePlan = plans[recommended];
  const activeQuote = quotes[recommended];
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const formatPrice = (amount: number) => money.format(amount);
  const formatUsage = axis.format?.(actual) ?? actual.toLocaleString(locale);
  const summary =
    activePlan && activeQuote
      ? `${customIndex >= 0 ? "Recommended" : "Best value"} at ${formatUsage} ${usageUnit(axis.key, actual)}: ${activePlan.name} · ${formatPrice(activeQuote.price)}/mo`
      : "No plan fits this usage. Try a smaller estimate.";
  // Coalesce slider events so screen readers hear one settled quote, not every frame.
  const [announcement, setAnnouncement] = React.useState(summary);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setAnnouncement(summary), 400);
    return () => window.clearTimeout(timer);
  }, [summary]);
  const change = (next: number) => {
    if (value === undefined) setLocalValue(next);
    onValueChange?.(next);
  };
  const changeSecondary = (next: number) => {
    if (secondaryValue === undefined) setLocalSecondary(next);
    onSecondaryValueChange?.(next);
  };
  return (
    <div
      ref={ref}
      data-slot="usage-slider-pricing-table"
      data-recommended={activePlan?.id ?? ""}
      data-value={actual}
      className={`@container/usage w-full overflow-hidden rounded-[28px] border border-border/80 bg-card text-card-foreground shadow-[0_24px_80px_rgba(32,37,52,0.09)] ${className}`}
    >
      <div className="px-8 pt-8 pb-7 @max-[540px]/usage:px-4 @max-[540px]/usage:pt-6">
        <div className="text-center">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Your live monthly estimate
          </p>
          <div className="relative mx-auto mt-4 flex min-h-[116px] max-w-[350px] items-center justify-center overflow-hidden rounded-[22px] border border-border/80 bg-background/70 px-6 py-5 shadow-[0_16px_35px_rgba(32,37,52,0.08)]">
            <div
              aria-hidden="true"
              className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent"
            />
            <span className="text-[58px] leading-none tracking-[-0.055em] @max-[540px]/usage:text-[46px]">
              {activeQuote ? (
                <RollingPrice value={activeQuote.price} format={formatPrice} reduced={reduced} />
              ) : (
                "—"
              )}
            </span>
            <span className="ml-2 self-end pb-2 text-xs text-muted-foreground">/ month</span>
          </div>
          <div className="mt-3 flex min-h-6 items-center justify-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" />
            <h2 id={headingId} className="text-xs font-semibold">
              {activePlan ? `${activePlan.name} is your best fit` : "Adjust your usage"}
            </h2>
          </div>
          <p className="mx-auto mt-2 max-w-[520px] text-xs leading-5 text-muted-foreground">
            Pricing scales as your team does. Move the slider to preview your monthly cost.
          </p>
        </div>
        <div className={`mt-7 grid gap-5 ${secondary ? "@min-[600px]/usage:grid-cols-2" : ""}`}>
          <UsageSlider
            axis={axis}
            value={actual}
            onChange={change}
            onInteraction={onInteractionStart}
          />
          {secondary && (
            <UsageSlider
              axis={secondary}
              value={second}
              onChange={changeSecondary}
              onInteraction={onInteractionStart}
            />
          )}
        </div>
      </div>
      <div
        data-recommendation
        className="flex min-h-11 items-center justify-center gap-2 border-y border-border/70 bg-muted/55 px-5 py-2 text-center text-[11px] font-medium @max-[540px]/usage:px-4"
      >
        <Check aria-hidden="true" className="size-3.5 shrink-0" />
        <span>{summary}</span>
      </div>
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
      {plans.length ? (
        <div data-comparison-stage className="relative isolate overflow-hidden rounded-b-[28px]">
          <div className="relative z-20 flex items-end justify-between border-b border-border/70 bg-card px-5 py-4 @max-[540px]/usage:px-3">
            <div>
              <p className="text-[8px] font-semibold tracking-[0.16em] text-primary uppercase">
                Plan comparison
              </p>
              <p className="mt-1 font-serif text-base tracking-[-0.02em]">Choose your foundation</p>
            </div>
            <p className="text-[9px] text-muted-foreground">Billed monthly</p>
          </div>
          <div
            aria-hidden="true"
            data-usage-spotlight
            style={{
              left: "25%",
              width: `${75 / plans.length}%`,
              transform: `translateX(${Math.max(0, recommended) * 100}%)`,
              opacity: recommended < 0 ? 0 : 1,
              transition: reduced
                ? "none"
                : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), width 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms",
            }}
            className="pointer-events-none absolute inset-y-0 z-0 border-x border-primary/15 bg-primary/[0.055]"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
          </div>
          <table
            aria-labelledby={headingId}
            className="relative z-10 w-full table-fixed border-collapse text-[11px]"
          >
            <caption className="sr-only">
              Monthly plan estimates and included features. {summary}
            </caption>
            <colgroup>
              <col style={{ width: "25%" }} />
              {plans.map((plan) => (
                <col key={plan.id} style={{ width: `${75 / plans.length}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="px-5 py-4 text-left align-bottom font-normal text-muted-foreground @max-[540px]/usage:px-3"
                >
                  <span className="block text-[10px]">Monthly estimate</span>
                </th>
                {plans.map((plan, index) => (
                  <th
                    key={plan.id}
                    scope="col"
                    data-plan-column={plan.id}
                    className="px-3 pt-3 pb-4 text-left align-top font-normal"
                  >
                    <span
                      className={`mb-1 flex h-3 items-center gap-1 text-[8px] font-semibold tracking-[0.08em] uppercase ${index === recommended ? "text-foreground" : "invisible"}`}
                    >
                      <span className="size-1 rounded-full bg-primary" />
                      Best fit
                    </span>
                    <span className="block text-[13px] font-semibold @max-[540px]/usage:text-xs">
                      {plan.name}
                    </span>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-1 gap-y-1">
                      <span className="text-[27px] @max-[540px]/usage:text-[22px]">
                        <RollingPrice
                          value={quotes[index]!.price}
                          format={formatPrice}
                          reduced={reduced}
                        />
                      </span>
                      <span className="text-[10px] text-muted-foreground">/mo</span>
                    </div>
                    {plan.highlights?.length ? (
                      <p className="mt-1 text-[10px] leading-3.5 text-muted-foreground">
                        {plan.highlights.join(" · ")}
                      </p>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-t border-border/60"
                  data-feature-row={row.label}
                >
                  <th
                    scope="row"
                    className="px-5 py-2 text-left text-[10px] leading-4 font-normal text-muted-foreground @max-[540px]/usage:px-3"
                  >
                    {row.label}
                  </th>
                  {plans.map((plan, index) => {
                    const result = row.values(plan, quotes[index]!);
                    const metric =
                      typeof result === "number"
                        ? { amount: result }
                        : result && typeof result === "object" && "amount" in result
                          ? (result as UsagePricingMetric)
                          : null;
                    return (
                      <td
                        key={plan.id}
                        data-feature-plan={plan.id}
                        className="px-3 py-2.5 leading-4 font-medium"
                      >
                        {metric ? (
                          <Count {...metric} reduced={reduced} locale={locale} />
                        ) : (
                          (result as React.ReactNode)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border/60">
                <th
                  scope="row"
                  className="px-5 py-2 text-left text-[10px] font-normal text-muted-foreground @max-[540px]/usage:px-3"
                >
                  Make it yours
                </th>
                {plans.map((plan, index) => (
                  <td key={plan.id} className="px-3 py-3">
                    <button
                      type="button"
                      disabled={!quotes[index]!.eligible}
                      data-select-plan={plan.id}
                      aria-label={`Choose ${plan.name}`}
                      onClick={() => {
                        onInteractionStart?.();
                        onSelect?.(plan.id);
                      }}
                      className={`flex min-h-8 w-full items-center justify-center gap-1 rounded-md border px-1 py-1.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none ${index === recommended ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "border-border bg-card text-foreground hover:bg-muted"}`}
                    >
                      {quotes[index]!.eligible ? (
                        <>
                          Choose <ArrowUpRight aria-hidden="true" className="size-3" />
                        </>
                      ) : (
                        "Unavailable"
                      )}
                    </button>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Add plans to compare estimates.
        </p>
      )}
    </div>
  );
}

export default UsageSliderPricingTable;
