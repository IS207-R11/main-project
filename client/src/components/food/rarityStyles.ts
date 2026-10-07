import type { Rarity } from "@/types/food";

export interface CardRarityStyle {
  badge: string;
  border: string;
  glow: string;
  ring: string;
  text: string;
  accentBg: string;
  backGlow: string;
  innerBorder: string;
  cornerAccent: string;
}

export const cardRarityStyles: Record<Rarity, CardRarityStyle> = {
  SSR: {
    badge: "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black shadow-sm",
    border: "border-amber-400/80 hover:border-amber-300",
    glow: "shadow-[0_8px_30px_rgba(251,191,36,0.28)]",
    ring: "ring-2 ring-amber-400/40",
    text: "text-amber-500",
    accentBg: "bg-amber-500/10",
    backGlow: "shadow-[0_0_35px_rgba(251,191,36,0.35)]",
    innerBorder: "border-amber-400/30",
    cornerAccent: "text-amber-400",
  },
  SR: {
    badge: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold shadow-sm",
    border: "border-purple-400/80 hover:border-purple-300",
    glow: "shadow-[0_8px_25px_rgba(168,85,247,0.22)]",
    ring: "ring-2 ring-purple-400/40",
    text: "text-purple-400",
    accentBg: "bg-purple-500/10",
    backGlow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]",
    innerBorder: "border-purple-400/30",
    cornerAccent: "text-purple-400",
  },
  UC: {
    badge: "bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold shadow-sm",
    border: "border-sky-400/80 hover:border-sky-300",
    glow: "shadow-[0_8px_20px_rgba(14,165,233,0.18)]",
    ring: "ring-2 ring-sky-400/30",
    text: "text-sky-400",
    accentBg: "bg-sky-500/10",
    backGlow: "shadow-[0_0_25px_rgba(14,165,233,0.25)]",
    innerBorder: "border-sky-400/30",
    cornerAccent: "text-sky-400",
  },
  C: {
    badge: "bg-secondary text-white font-semibold shadow-sm",
    border: "border-border hover:border-secondary/70",
    glow: "shadow-[0_4px_16px_rgba(244,162,97,0.18)]",
    ring: "ring-2 ring-secondary/30",
    text: "text-secondary",
    accentBg: "bg-secondary/10",
    backGlow: "shadow-[0_0_20px_rgba(244,162,97,0.2)]",
    innerBorder: "border-secondary/30",
    cornerAccent: "text-secondary",
  },
};

export const getCardRarityStyle = (rarity?: Rarity): CardRarityStyle => {
  if (!rarity || !cardRarityStyles[rarity]) {
    return cardRarityStyles.C;
  }
  return cardRarityStyles[rarity];
};
