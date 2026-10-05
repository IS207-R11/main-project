"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "cn";

export interface UnderlineTabItem<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  count?: number | string;
  badge?: React.ReactNode;
  disabled?: boolean;
}

interface UnderlineTabsProps<T extends string = string> {
  tabs: UnderlineTabItem<T>[];
  activeTab: T;
  onChange: (value: T) => void;
  layoutId?: string;
  align?: "left" | "center" | "full";
  className?: string;
  tabClassName?: string;
}

export function UnderlineTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  layoutId = "underline-tabs-indicator",
  align = "left",
  className,
  tabClassName,
}: UnderlineTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "relative flex items-center border-b border-border/60 w-full overflow-x-auto no-scrollbar",
        align === "center" && "justify-center",
        align === "full" && "justify-stretch",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.value)}
            className={cn(
              "relative flex items-center justify-center gap-2 py-3 px-4 text-xs sm:text-sm tracking-normal transition-colors duration-200 cursor-pointer select-none whitespace-nowrap outline-none",
              align === "full" ? "flex-1" : "flex-initial",
              isActive
                ? "text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground font-medium",
              tab.disabled && "opacity-40 cursor-not-allowed hover:text-muted-foreground",
              tabClassName
            )}
          >
            {tab.icon && (
              <span className={cn("text-xs transition-colors shrink-0", isActive ? "text-primary" : "text-muted-foreground")}>
                {tab.icon}
              </span>
            )}

            <span>{tab.label}</span>

            {tab.count !== undefined && (
              <span
                className={cn(
                  "ml-1 text-[11px] px-1.5 py-0.2 rounded-full font-bold transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            )}

            {tab.badge}

            {/* Framer motion animated underline */}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary rounded-full z-10"
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 35,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
