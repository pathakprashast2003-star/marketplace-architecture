"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface SocialLink {
  name: string;
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export interface FooterLink {
  name: string;
  Icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
  brand: {
    name: string;
    description: string;
  };
  socialLinks: SocialLink[];
  columns: FooterColumn[];
  copyright?: string;
}

export const Footer = React.forwardRef<HTMLDivElement, FooterProps>(
  ({ className, brand, socialLinks, columns, copyright, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="contentinfo"
        className={cn("pt-24", className)}
        {...props}
      >
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <a
                href="#"
                className="text-xl font-semibold text-foreground no-underline"
              >
                {brand.name}
              </a>
              <p className="mt-2 text-sm text-foreground/70">
                {brand.description}
              </p>

              <p className="text-sm font-light text-foreground/65 mt-3.5">
                {socialLinks.map((link, index) => {
                  const isExternal = link.href.startsWith("http");
                  return (
                    <React.Fragment key={link.name}>
                      <a
                        className="text-foreground/70 hover:text-foreground transition-colors no-underline"
                        target={isExternal ? "_blank" : undefined}
                        href={link.href}
                        onClick={link.onClick}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                      >
                        {link.name}
                      </a>
                      {index < socialLinks.length - 1 && " • "}
                    </React.Fragment>
                  );
                })}
              </p>
            </div>

            <div className="grid grid-cols-2 mt-16 md:grid-cols-3 lg:col-span-8 lg:justify-items-end lg:mt-0 gap-y-10 gap-x-8">
              {columns.map(({ title, links }) => (
                <div key={title} className="last:mt-12 md:last:mt-0">
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <ul className="mt-4 space-y-2.5 list-none p-0 m-0">
                    {links.map(({ name, Icon, href, onClick }) => (
                      <li key={name}>
                        <a
                          href={href || "#"}
                          onClick={onClick}
                          className="text-sm transition-all text-foreground/70 hover:text-foreground group inline-flex items-center no-underline"
                        >
                          <Icon className="inline stroke-2 h-4 w-4 mr-1.5 transition-all stroke-foreground/65 group-hover:stroke-foreground shrink-0" />
                          {name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {copyright && (
            <div className="mt-20 border-t border-border pt-6 pb-8">
              <p className="text-xs text-foreground/65">{copyright}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Footer.displayName = "Footer";
