export const SERVICES = [
  { id: "ride", label: "Rides", icon: "🚗", color: "#2563eb", basePrice: 25, duration: 60, desc: "Anywhere you need to go" },
  { id: "dog", label: "Dog Sitting", icon: "🐾", color: "#16a34a", basePrice: 45, duration: 180, desc: "In-home or at your place" },
  { id: "errand", label: "Errands", icon: "🛒", color: "#d97706", basePrice: 30, duration: 90, desc: "Grocery runs, pickups & more" },
  { id: "house", label: "Housekeeping", icon: "🧹", color: "#059669", basePrice: 60, duration: 120, desc: "Cleaning, tidying & more" },
  { id: "filter", label: "AC Filters", icon: "❄️", color: "#7c3aed", basePrice: 35, duration: 60, desc: "Filter swap & replacement", premium: true },
  { id: "other", label: "Other", icon: "⚡", color: "#dc2626", basePrice: 20, duration: 60, desc: "Just ask — Lou does it" },
];

export const PLANS = [
  { id: "free", label: "Free", price: 0, color: "#64748b", perks: ["Standard booking", "View calendar"] },
  { id: "plus", label: "Sweet Lou+", price: 4.99, color: "#2563eb", perks: ["Priority scheduling", "Discounted services", "1 free reschedule/mo", "AC Filter bookings"] },
  { id: "vip", label: "VIP", price: 9.99, color: "#d97706", perks: ["First access to openings", "Emergency requests", "Loyalty rewards", "Everything in Plus"] },
];

export const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
export const ADMIN_PIN = "1234";
