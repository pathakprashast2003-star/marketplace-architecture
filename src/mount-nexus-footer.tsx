"use client";

import React from "react";
import ReactDOM from "react-dom/client";
import { NexusFooter } from "../components/ui/footer-demo";
import "../styles/globals.css";

const mountEl = document.getElementById("nexus-footer-root");
if (mountEl) {
  const root = ReactDOM.createRoot(mountEl);
  root.render(
    <React.StrictMode>
      <NexusFooter className="border-t border-slate-900/10 bg-white/75 backdrop-blur-md pt-16" />
    </React.StrictMode>
  );
}

export { NexusFooter };
export default NexusFooter;
