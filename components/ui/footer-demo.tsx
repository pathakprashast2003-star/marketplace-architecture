"use client";

import * as React from "react";
import { Aperture, Film, Globe, Instagram, Twitter } from "lucide-react";
import {
  Footer,
  type FooterColumn,
  type FooterLegalLink,
  type SocialLink,
} from "@/components/ui/footer";

declare global {
  interface Window {
    openInquiryModal?: (creatorName: string, craft: string) => void;
    openFoundingModal?: () => void;
    openCriteriaModal?: () => void;
  }
}

export interface NexusFooterProps {
  className?: string;
}

export function NexusFooter({ className }: NexusFooterProps) {
  const triggerInquiry = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      typeof window !== "undefined" &&
      typeof window.openInquiryModal === "function"
    ) {
      e.preventDefault();
      window.openInquiryModal("", "");
    }
  };

  const triggerFounding = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      typeof window !== "undefined" &&
      typeof window.openFoundingModal === "function"
    ) {
      e.preventDefault();
      window.openFoundingModal();
    }
  };

  const triggerCriteria = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      typeof window !== "undefined" &&
      typeof window.openCriteriaModal === "function"
    ) {
      e.preventDefault();
      window.openCriteriaModal();
    }
  };

  const openLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const tab = document.querySelector<HTMLButtonElement>(".jn-tab[data-side=login]");
    if (tab) {
      e.preventDefault();
      tab.click();
      document.getElementById("join")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // No social accounts yet; add them here when they exist.
  const socialLinks: SocialLink[] = [];

  const columns: FooterColumn[] = [
    {
      title: "Clients",
      links: [
        { name: "Browse creators", href: "#showcase" },
        { name: "How it works", href: "#how" },
        { name: "Fee comparison", href: "#fees" },
        { name: "Post a request", href: "#join", onClick: triggerInquiry },
      ],
    },
    {
      title: "Creators",
      links: [
        { name: "Claim a founding spot", href: "#founding", onClick: triggerFounding },
        { name: "What we look for", href: "#founding" },
        { name: "Pricing", href: "#fees" },
        { name: "Log in", href: "#join", onClick: openLogin },
      ],
    },
  ];

  // Add Terms and Privacy here once those pages exist.
  const legalLinks: FooterLegalLink[] = [];

  return (
    <Footer
      className={className}
      brand={{
        name: "nexus.",
        logo: (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#09090B] text-[#FFFFFF]">
            <Aperture className="h-[18px] w-[18px] stroke-[2] stroke-[#FFFFFF]" />
          </span>
        ),
        description:
          "Hire reviewed creators and learn from real teachers. Contact them directly. 0% commission.",
      }}
      socialLinks={socialLinks}
      columns={columns}
      copyright="© 2026 Nexus. All rights reserved."
      legalLinks={legalLinks}
    />
  );
}

export function FooterDemo() {
  return <NexusFooter className="border-t border-slate-200 bg-white" />;
}
