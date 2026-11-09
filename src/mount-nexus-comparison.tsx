"use client";

import React from "react";
import ReactDOM from "react-dom/client";
import { NexusComparisonSection } from "../components/ui/nexus-comparison-slider";
import "../styles/globals.css";

// ── Mount Impeccable Nexus Pricing Section into DOM ──
const mountEl = document.getElementById("nexus-pricing-root");
if (mountEl) {
  const root = ReactDOM.createRoot(mountEl);
  root.render(
    <NexusComparisonSection 
      initialBillings={105000}
      onSelectPlan={(planId) => {
        if (typeof window !== "undefined" && (window as any).openInquiryModal) {
          (window as any).openInquiryModal("Nexus Direct Membership", "Curated Commercial Roster");
        } else {
          alert(`Selected ${planId}`);
        }
      }}
    />
  );
}

export { NexusComparisonSection };
export default NexusComparisonSection;
