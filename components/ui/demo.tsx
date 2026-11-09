"use client";

import * as React from "react";
import { ArrowUpRight, Gauge, Layers3, RotateCcw, ShieldCheck } from "lucide-react";
import { UsageSliderPricingTable } from "@/components/ui/usage-slider-pricing-table";
import type { UsagePricingPlan, UsagePricingRow } from "@/components/ui/usage-slider-pricing-table";

export const USAGE_DEMO_PLANS: UsagePricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    basePrice: 19,
    includedSeats: 1,
    perSeat: 12,
    includedRequests: 10000,
    requestsPerSeat: 1000,
    includedStorage: 5,
    storagePerSeat: 1,
    overagePer1k: 2,
    highlights: ["1 seat included"],
  },
  {
    id: "team",
    name: "Team",
    basePrice: 79,
    includedSeats: 5,
    perSeat: 6,
    includedRequests: 25000,
    requestsPerSeat: 2000,
    includedStorage: 20,
    storagePerSeat: 2,
    overagePer1k: 1,
    highlights: ["5 seats included"],
  },
  {
    id: "business",
    name: "Business",
    basePrice: 199,
    includedSeats: 15,
    perSeat: 3,
    includedRequests: 100000,
    requestsPerSeat: 5000,
    includedStorage: 100,
    storagePerSeat: 5,
    overagePer1k: 0.5,
    highlights: ["15 seats included"],
  },
];

export const USAGE_DEMO_ROWS: UsagePricingRow[] = [
  {
    label: "Included requests",
    values: (_, quote) => quote.includedRequests,
  },
  {
    label: "Pooled storage",
    values: (_, quote) => ({ amount: quote.includedStorage, unit: "GB" }),
  },
  { label: "Per extra seat", values: (plan) => `$${plan.perSeat}` },
  {
    label: "Support",
    values: (plan) =>
      plan.id === "starter" ? "Community" : plan.id === "team" ? "Priority" : "Dedicated",
  },
];

export default function UsageSliderPricingTableDemo({ autoplay = true }: { autoplay?: boolean }) {
  const [value, setValue] = React.useState(1);
  const [mode, setMode] = React.useState(autoplay ? "tour" : "manual");
  const [run, setRun] = React.useState(0);
  const [choice, setChoice] = React.useState("");
  const [reduced, setReduced] = React.useState(true);
  const stopped = React.useRef(false);
  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  React.useEffect(() => {
    if (!autoplay || reduced || mode !== "tour") return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      if (stopped.current) return;
      const progress = Math.min(1, Math.max(0, (now - start - 1500) / 4000));
      // Smoothstep, one pass. All simulation belongs to this demo.
      setValue(Math.ceil(1 + 59 * progress * progress * (3 - 2 * progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setMode("complete");
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoplay, reduced, mode, run]);
  const stop = () => {
    stopped.current = true;
    setMode("manual");
  };
  const replay = () => {
    stopped.current = false;
    setChoice("");
    setValue(1);
    setMode("tour");
    setRun((previous) => previous + 1);
  };
  return (
    <main
      data-usage-demo
      data-tour={autoplay && !reduced ? mode : "manual"}
      className="relative min-h-svh w-full overflow-hidden bg-background px-5 pb-16 text-foreground"
    >
      <div
        aria-hidden="true"
        className="absolute -top-48 left-1/2 h-[540px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.075] blur-[120px]"
      />
      <div className="relative mx-auto w-full max-w-[1040px]">
        <nav
          aria-label="Primary navigation"
          className="flex h-20 items-center justify-between border-b border-border/70"
        >
          <a href="#" className="flex items-center gap-3 font-serif text-xl tracking-[-0.03em]">
            <span className="grid size-7 place-items-center rounded-full bg-foreground font-sans text-[10px] font-bold text-background">
              N
            </span>
            Northstar
          </a>
          <div className="hidden items-center gap-7 text-xs font-medium text-muted-foreground sm:flex">
            <a href="#calculator" className="transition-colors hover:text-foreground">
              Pricing
            </a>
            <a href="#principles" className="transition-colors hover:text-foreground">
              Principles
            </a>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-background transition-transform hover:-translate-y-0.5"
            >
              Start building
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </button>
          </div>
          <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase sm:hidden">
            Pricing
          </span>
        </nav>

        <header className="relative mx-auto max-w-[850px] pt-20 pb-14 text-center max-[560px]:pt-14 max-[560px]:pb-10">
          <span
            aria-hidden="true"
            className="absolute top-20 -left-8 hidden font-serif text-xs text-muted-foreground/65 lg:block"
          >
            01 / Pricing
          </span>
          <p className="mb-5 text-[10px] font-semibold tracking-[0.24em] text-primary uppercase">
            Fair by design
          </p>
          <h1 className="text-balance font-serif text-[clamp(3rem,7vw,6.4rem)] leading-[0.92] font-normal tracking-[-0.052em]">
            Pricing that moves
            <br />
            <span className="italic">at your pace.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-[560px] text-[15px] leading-7 text-muted-foreground">
            Begin with what you need today. As your team grows, your plan adapts—with clear numbers,
            thoughtful limits, and no hidden surprises.
          </p>
          <div className="mx-auto mt-8 flex w-fit items-center gap-3 text-[10px] font-semibold tracking-[0.13em] text-muted-foreground uppercase">
            <span className="h-px w-10 bg-border" />
            Scroll to calculate
            <span className="h-px w-10 bg-border" />
          </div>
        </header>

        <section id="calculator" aria-label="Interactive pricing calculator">
          <div className="mb-4 flex items-end justify-between px-2">
            <div>
              <p className="text-[9px] font-semibold tracking-[0.2em] text-primary uppercase">
                Interactive estimate
              </p>
              <p className="mt-1 font-serif text-xl tracking-[-0.025em]">Shape your plan</p>
            </div>
            <p className="hidden max-w-[280px] text-right text-[11px] leading-5 text-muted-foreground sm:block">
              Every number updates in real time as you explore.
            </p>
          </div>
          <UsageSliderPricingTable
            plans={USAGE_DEMO_PLANS}
            rows={USAGE_DEMO_ROWS}
            value={value}
            onValueChange={setValue}
            onInteractionStart={stop}
            onSelect={(id) =>
              setChoice(
                `${USAGE_DEMO_PLANS.find((plan) => plan.id === id)?.name} selected — sample only.`,
              )
            }
          />
          <footer className="mt-4 flex min-h-6 items-center justify-between gap-3 px-2 text-[10px] text-muted-foreground">
            <p role="status">
              {choice ||
                (mode === "tour" && autoplay && !reduced
                  ? "Try the slider. Your best fit follows."
                  : "Sample estimates · no payment required")}
            </p>
            {autoplay && !reduced && (
              <button
                type="button"
                data-replay
                onClick={replay}
                className="inline-flex shrink-0 items-center gap-1.5 rounded px-1 py-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw aria-hidden="true" className="size-3" />
                Replay movement
              </button>
            )}
          </footer>
        </section>

        <section id="principles" className="pt-24 max-[560px]:pt-16">
          <div className="grid border-y border-border/70 md:grid-cols-[0.85fr_2.15fr]">
            <div className="border-b border-border/70 py-8 md:border-r md:border-b-0 md:pr-10">
              <p className="text-[9px] font-semibold tracking-[0.2em] text-primary uppercase">
                The fine print
              </p>
              <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.035em]">
                Simple should
                <br />
                feel simple.
              </h2>
            </div>
            <div className="grid sm:grid-cols-3">
              {[
                {
                  icon: Gauge,
                  number: "01",
                  title: "Scale naturally",
                  body: "Only pay for the capacity your team is ready to use.",
                },
                {
                  icon: Layers3,
                  number: "02",
                  title: "Everything included",
                  body: "Core tools stay available on every plan, from day one.",
                },
                {
                  icon: ShieldCheck,
                  number: "03",
                  title: "Change anytime",
                  body: "Move between plans as your needs evolve. No lock-in.",
                },
              ].map(({ icon: Icon, number, title, body }) => (
                <article
                  key={number}
                  className="group border-b border-border/70 py-8 last:border-b-0 sm:border-r sm:border-b-0 sm:px-6 sm:last:border-r-0"
                >
                  <div className="flex items-center justify-between">
                    <Icon
                      aria-hidden="true"
                      className="size-4 text-primary transition-transform group-hover:-translate-y-0.5"
                    />
                    <span className="font-serif text-[10px] text-muted-foreground">{number}</span>
                  </div>
                  <h3 className="mt-8 text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <footer className="flex items-center justify-between pt-8 text-[10px] text-muted-foreground">
          <p>Clear pricing for ambitious teams.</p>
          <p>Monthly billing · Cancel anytime</p>
        </footer>
      </div>
    </main>
  );
}
