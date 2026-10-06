import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Tinder Món Ăn | Ăn gì?",
  description: "Trang quẹt món ăn thông minh.",
};

export default function TinderPage() {
  redirect("/?tab=tinder");
}
