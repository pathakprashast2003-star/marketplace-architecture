"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface SocialLink {
  name: string;
  href: string;
  Icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export interface FooterLink {
  name: string;
  Icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterLegalLink {
  name: string;
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
  brand: {
    name: string;
    description: string;
    logo?: React.ReactNode;
  };
  socialLinks: SocialLink[];
  columns: FooterColumn[];
  copyright?: string;
  legalLinks?: FooterLegalLink[];
}

export const Footer = React.forwardRef<HTMLDivElement, FooterProps>(
  (
    { className, brand, socialLinks, columns, copyright, legalLinks, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="contentinfo"
        className={cn("bg-white text-[#09090B] pt-20 pb-10", className)}
        {...props}
      >
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col justify-between gap-12 lg:flex-row lg:items-start">
            {/* Brand Identity + Channel Icon Strip */}
            <div className="flex w-full flex-col gap-5 lg:max-w-sm">
              <a
                href="#"
                className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#09090B] no-underline w-fit"
              >
                {brand.logo}
                <span>{brand.name}</span>
              </a>
              <p className="text-sm leading-relaxed text-[#3F3F46] max-w-xs">
                {brand.description}
              </p>

              <ul className="flex items-center gap-5 list-none p-0 m-0 text-[#27272A]">
                {socialLinks.map((link) => {
                  const isExternal = link.href.startsWith("http");
                  const Icon = link.Icon;
                  return (
                    <li key={link.name}>
                      <a
                        aria-label={link.name}
                        title={link.name}
                        href={link.href}
                        onClick={link.onClick}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center text-sm font-medium text-[#27272A] hover:text-[#09090B] transition-colors no-underline"
                      >
                        {Icon ? (
                          <Icon className="h-[18px] w-[18px] stroke-[1.9]" />
                        ) : (
                          link.name
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Clean 3-Column Navigation Grid */}
            <div className="grid w-full grid-cols-2 gap-10 md:grid-cols-3 lg:gap-16 lg:w-auto">
              {columns.map(({ title, links }) => (
                <div key={title}>
                  <h3 className="mb-4 text-sm font-bold text-[#09090B]">
                    {title}
                  </h3>
                  <ul className="space-y-3 list-none p-0 m-0">
                    {links.map(({ name, Icon, href, onClick }) => (
                      <li key={name}>
                        <a
                          href={href || "#"}
                          onClick={onClick}
                          className="text-sm font-medium text-[#3F3F46] hover:text-[#09090B] transition-colors inline-flex items-center gap-1.5 no-underline"
                        >
                          {Icon && (
                            <Icon className="h-4 w-4 stroke-[1.8] shrink-0" />
                          )}
                          <span>{name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Hairline Legal & Attribution Bar */}
          {(copyright || (legalLinks && legalLinks.length > 0)) && (
            <div className="mt-16 flex flex-col justify-between gap-4 border-t border-slate-200 pt-7 text-xs font-medium text-[#52525B] md:flex-row md:items-center">
              {copyright && <p className="m-0 text-[#3F3F46]">{copyright}</p>}
              {legalLinks && legalLinks.length > 0 && (
                <ul className="flex flex-wrap items-center gap-6 list-none p-0 m-0">
                  {legalLinks.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        onClick={item.onClick}
                        className="text-[#3F3F46] hover:text-[#09090B] transition-colors no-underline"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Footer.displayName = "Footer";
