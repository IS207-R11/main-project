import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Tinder Món Ăn | Ăn gì?",
  description: "Trang đang tạm ẩn để nâng cấp hệ thống.",
};

export default function TinderPage() {
  redirect("/");
}
