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
      window.openInquiryModal("Curated Director", "Commercial Roster");
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

  const socialLinks: SocialLink[] = [
    { name: "Showreels", href: "#roster", Icon: Film },
    { name: "Instagram", href: "#roster", Icon: Instagram },
    { name: "X / Twitter", href: "#how", Icon: Twitter },
    {
      name: "Direct Dispatch",
      href: "#how",
      Icon: Globe,
      onClick: triggerInquiry,
    },
  ];

  const columns: FooterColumn[] = [
    {
      title: "Clients",
      links: [
        { name: "Curated Roster", href: "#roster" },
        { name: "Fee Calculator", href: "#fees" },
        { name: "3-Step Protocol", href: "#how" },
        {
          name: "Direct Dispatch",
          href: "#how",
          onClick: triggerInquiry,
        },
      ],
    },
    {
      title: "Creators",
      links: [
        {
          name: "Apply Founding",
          href: "#founding",
          onClick: triggerFounding,
        },
        { name: "Cohort I Perks", href: "#founding" },
        {
          name: "Curation Criteria",
          href: "#roster",
          onClick: triggerCriteria,
        },
        { name: "Zero-Cut Model", href: "#fees" },
      ],
    },
    {
      title: "Governance",
      links: [
        { name: "Zero-Escrow Terms", href: "#fees" },
        { name: "AICP Standards", href: "#how" },
        { name: "Master IP Rights", href: "#how" },
        { name: "Support & Review", href: "#founding" },
      ],
    },
  ];

  const legalLinks: FooterLegalLink[] = [
    { name: "Terms and Conditions", href: "#fees" },
    { name: "Privacy Policy", href: "#founding" },
  ];

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
          "Direct access to vetted commercial directors and visual craftspeople. Zero platform markups.",
      }}
      socialLinks={socialLinks}
      columns={columns}
      copyright="© 2026 Nexus Direct. All rights reserved."
      legalLinks={legalLinks}
    />
  );
}

export function FooterDemo() {
  return <NexusFooter className="border-t border-slate-200 bg-white" />;
}
