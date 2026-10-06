import type {
  FoodItem,
  MealSession,
  TimePeriod,
} from "@/types/food";

export const allFoods: FoodItem[] = [];

export function formatPrice(price: number): string {
  // Price in data is in thousands (e.g. 45 = 45.000 VND)
  const fullPrice = price * 1000;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(fullPrice);
}

export function periodToSession(period: TimePeriod): MealSession {
  switch (period) {
    case "morning":
      return "Sáng sớm";
    case "midday":
      return "Giữa trưa";
    case "afternoon":
      return "Chiều";
    case "night":
      return "Tối";
  }
}

export function sessionToPeriod(session: MealSession): TimePeriod {
  switch (session) {
    case "Sáng sớm":
      return "morning";
    case "Giữa trưa":
      return "midday";
    case "Chiều":
      return "afternoon";
    case "Tối":
      return "night";
  }
}
