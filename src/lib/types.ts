export type EventCategory = "sound_bath" | "supper" | "run" | "book_circle" | "cycling" | "other";
export type EventStatus = "draft" | "published" | "sold_out" | "cancelled" | "past";
export type PaymentMode = "razorpay" | "manual_upi" | "free";
export type RegistrationStatus =
  | "pending"
  | "awaiting_payment"
  | "awaiting_verification"
  | "approved"
  | "rejected"
  | "refunded"
  | "attended"
  | "no_show";

export interface Event {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  cover_image_url: string;
  category: EventCategory;
  start_at: string; // ISO
  end_at: string;
  venue_name: string;
  venue_address: string;
  venue_map_url: string;
  capacity: number;
  registered_count: number;
  price_paise: number;
  payment_mode: PaymentMode;
  upi_id?: string;
  refund_policy: string;
  status: EventStatus;
}

export interface Registration {
  id: string;
  pass_code: string;
  event_id: string;
  full_name: string;
  phone: string;
  email: string;
  age: number;
  city: string;
  instagram?: string;
  heard_from?: string;
  notes?: string;
  payment_mode: PaymentMode;
  amount_paise: number;
  status: RegistrationStatus;
  created_at: string;
}
