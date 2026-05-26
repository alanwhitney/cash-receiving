export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_margin: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_margin?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_margin?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          vendor_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          vendor_id: string;
          department_id: string | null;
          name: string;
          upc: string;
          case_cost: number;
          case_size: number;
          case_discount: number;
          unit_retail: number;
          bottle_deposit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          department_id?: string | null;
          name: string;
          upc: string;
          case_cost?: number;
          case_size?: number;
          case_discount?: number;
          unit_retail?: number;
          bottle_deposit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          department_id?: string | null;
          name?: string;
          upc?: string;
          case_cost?: number;
          case_size?: number;
          case_discount?: number;
          unit_retail?: number;
          bottle_deposit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      item_price_history: {
        Row: {
          id: string;
          item_id: string;
          case_cost: number;
          case_size: number;
          case_discount: number;
          unit_retail: number;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          case_cost: number;
          case_size: number;
          case_discount: number;
          unit_retail: number;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          case_cost?: number;
          case_size?: number;
          case_discount?: number;
          unit_retail?: number;
          recorded_at?: string;
        };
        Relationships: [];
      };
      receive_sessions: {
        Row: {
          id: string;
          user_id: string;
          vendor_id: string;
          status: "open" | "completed";
          notes: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          vendor_id: string;
          status?: "open" | "completed";
          notes?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          vendor_id?: string;
          status?: "open" | "completed";
          notes?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      receive_lines: {
        Row: {
          id: string;
          session_id: string;
          item_id: string;
          cases_received: number;
          case_cost_override: number | null;
          case_discount_override: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          item_id: string;
          cases_received?: number;
          case_cost_override?: number | null;
          case_discount_override?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          item_id?: string;
          cases_received?: number;
          case_cost_override?: number | null;
          case_discount_override?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
  };
}

export type Department =
  Database["public"]["Tables"]["departments"]["Row"];
export type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type Item = Database["public"]["Tables"]["items"]["Row"];
export type ItemPriceHistory =
  Database["public"]["Tables"]["item_price_history"]["Row"];
export type ReceiveSession =
  Database["public"]["Tables"]["receive_sessions"]["Row"];
export type ReceiveLine =
  Database["public"]["Tables"]["receive_lines"]["Row"];

export type ItemWithDepartment = Item & {
  departments: Department | null;
};

export type ReceiveSessionWithVendor = ReceiveSession & {
  vendors: Vendor;
};

export type ReceiveLineWithItem = ReceiveLine & {
  items: ItemWithDepartment;
};
