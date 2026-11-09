"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { UsageSliderPricingTable } from "@/components/ui/usage-slider-pricing-table";
import type { UsagePricingPlan, UsagePricingRow } from "@/components/ui/usage-slider-pricing-table";

export const USAGE_DEMO_PLANS: UsagePricingPlan[] = [
  { id: "starter", name: "Starter", basePrice: 19, includedSeats: 1, perSeat: 12, includedRequests: 10000, requestsPerSeat: 1000, includedStorage: 5, storagePerSeat: 1, overagePer1k: 2, highlights: ["1 seat included"] },
  { id: "team", name: "Team", basePrice: 79, includedSeats: 5, perSeat: 6, includedRequests: 25000, requestsPerSeat: 2000, includedStorage: 20, storagePerSeat: 2, overagePer1k: 1, highlights: ["5 seats included"] },
  { id: "business", name: "Business", basePrice: 199, includedSeats: 15, perSeat: 3, includedRequests: 100000, requestsPerSeat: 5000, includedStorage: 100, storagePerSeat: 5, overagePer1k: 0.5, highlights: ["15 seats included"] },
];

export const USAGE_DEMO_ROWS: UsagePricingRow[] = [
  { label: "Included requests", values: (_, quote) => quote.includedRequests },
  { label: "Pooled storage", values: (_, quote) => ({ amount: quote.includedStorage, unit: "GB" }) },
  { label: "Per extra seat", values: (plan) => `$${plan.perSeat}` },
  { label: "Support", values: (plan) => plan.id === "starter" ? "Community" : plan.id === "team" ? "Priority" : "Dedicated" },
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
  const stop = () => { stopped.current = true; setMode("manual"); };
  const replay = () => { stopped.current = false; setChoice(""); setValue(1); setMode("tour"); setRun((previous) => previous + 1); };
  return <main data-usage-demo data-tour={autoplay && !reduced ? mode : "manual"} className="flex min-h-svh w-full items-center justify-center bg-background p-3 text-foreground">
    <div className="w-full max-w-[696px]">
      <header className="mb-3 flex items-end justify-between gap-3 px-1">
        <div><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">A little team. A big idea.</p><h1 className="text-[26px] font-semibold leading-tight tracking-tight max-[560px]:text-[24px]">Find your room to grow.</h1></div>
        <span className="mb-1 rounded-full border border-border px-2 py-1 text-[9px] text-muted-foreground">Sample</span>
      </header>
      <UsageSliderPricingTable plans={USAGE_DEMO_PLANS} rows={USAGE_DEMO_ROWS} value={value} onValueChange={setValue} onInteractionStart={stop} onSelect={(id) => setChoice(`${USAGE_DEMO_PLANS.find((plan) => plan.id === id)?.name} selected — sample only.`)} />
      <footer className="mt-3 flex min-h-6 items-center justify-between gap-3 px-1 text-[10px] text-muted-foreground">
        <p role="status">{choice || (mode === "tour" && autoplay && !reduced ? "Try the slider. Your best fit follows." : "Sample estimates · no payment required")}</p>
        {autoplay && !reduced && <button type="button" data-replay onClick={replay} className="inline-flex shrink-0 items-center gap-1.5 rounded px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RotateCcw aria-hidden="true" className="size-3" />Replay</button>}
      </footer>
    </div>
  </main>;
}

