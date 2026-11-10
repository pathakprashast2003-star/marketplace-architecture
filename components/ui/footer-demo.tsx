"use client";

import * as React from "react";
import {
  Award,
  Blocks,
  CreditCard,
  FileCheck2,
  Handshake,
  Layers,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Footer, type FooterColumn, type SocialLink } from "@/components/ui/footer";

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
    if (typeof window !== "undefined" && typeof window.openInquiryModal === "function") {
      e.preventDefault();
      window.openInquiryModal("Curated Director", "Commercial Roster");
    }
  };

  const triggerFounding = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined" && typeof window.openFoundingModal === "function") {
      e.preventDefault();
      window.openFoundingModal();
    }
  };

  const triggerCriteria = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined" && typeof window.openCriteriaModal === "function") {
      e.preventDefault();
      window.openCriteriaModal();
    }
  };

  const socialLinks: SocialLink[] = [
    { name: "Curated Roster", href: "#roster" },
    { name: "Direct Protocol", href: "#how" },
    { name: "Apply Founding", href: "#founding", onClick: triggerFounding },
  ];

  const columns: FooterColumn[] = [
    {
      title: "Clients",
      links: [
        { name: "Curated Roster", Icon: Users, href: "#roster" },
        { name: "Economics & Fees", Icon: CreditCard, href: "#fees" },
        { name: "3-Step Protocol", Icon: Layers, href: "#how" },
        {
          name: "Direct 30s Dispatch",
          Icon: Send,
          href: "#how",
          onClick: triggerInquiry,
        },
      ],
    },
    {
      title: "Creators",
      links: [
        {
          name: "Apply as Founding",
          Icon: Sparkles,
          href: "#founding",
          onClick: triggerFounding,
        },
        { name: "Founding Cohort I", Icon: Award, href: "#founding" },
        {
          name: "Curation Criteria",
          Icon: ShieldCheck,
          href: "#roster",
          onClick: triggerCriteria,
        },
        { name: "0% Commission Model", Icon: Blocks, href: "#fees" },
      ],
    },
    {
      title: "Governance",
      links: [
        { name: "Zero-Escrow Terms", Icon: Handshake, href: "#fees" },
        { name: "AICP Deal Standards", Icon: FileCheck2, href: "#how" },
        { name: "Privacy & NDA", Icon: Scale, href: "#founding" },
      ],
    },
  ];

  return (
    <Footer
      className={className}
      brand={{
        name: "nexus.",
        description:
          "Direct access to hand-vetted commercial directors and visual craftspeople. Zero platform markups.",
      }}
      socialLinks={socialLinks}
      columns={columns}
      copyright="nexus. Direct Commercial Production © 2026 · 100% Creator-Owned IP"
    />
  );
}

export function FooterDemo() {
  return <NexusFooter className="mt-10" />;
}
