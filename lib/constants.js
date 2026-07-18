export const SERVICES = [
  { id: "ride",    label: "Rides",        icon: "🚗", color: "#2563eb", basePrice: 25, duration: 60,  desc: "Anywhere you need to go" },
  { id: "dog",     label: "Dog Sitting",  icon: "🐾", color: "#16a34a", basePrice: 45, duration: 180, desc: "In-home or at your place" },
  { id: "errand",  label: "Errands",      icon: "🛒", color: "#d97706", basePrice: 30, duration: 90,  desc: "Grocery runs, pickups & more" },
  { id: "house",   label: "Housekeeping", icon: "🧹", color: "#059669", basePrice: 60, duration: 120, desc: "Cleaning, tidying & more" },
  { id: "filter",  label: "AC Filters",   icon: "❄️", color: "#7c3aed", basePrice: 35, duration: 60,  desc: "Filter swap & replacement", vipOnly: true },
  { id: "other",   label: "Other",        icon: "⚡", color: "#dc2626", basePrice: 20, duration: 60,  desc: "Just ask — Lou does it" },
];

export const PLANS = [
  {
    id: "free",
    label: "Free",
    price: 0,
    color: "#64748b",
    perks: [
      "Standard booking",
      "View availability",
      "Book up to 30 days out",
    ],
  },
  {
    id: "vip",
    label: "VIP",
    price: 9.99,
    color: "#d97706",
    perks: [
      "Book up to 1 year in advance",
      "AC Filter bookings (service fee applies)",
      "10 loyalty points per month",
      "100 points = $100 off a ride",
      "First access to open slots",
      "Emergency same day requests",
    ],
  },
];

export const BOOKING_LIMIT = {
  free: 30,
  vip: 365,
};

export const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
export const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
export const ADMIN_PIN = "1234";
