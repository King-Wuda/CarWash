export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    PostgrestVersion: "12"
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: 'customer' | 'owner' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'owner' | 'admin'
          created_at?: string
        }
        Update: {
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'owner' | 'admin'
        }
        Relationships: []
      }
      car_washes: {
        Row: {
          id: string
          owner_id: string | null
          name: string
          description: string | null
          address: string
          city: string
          province: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          email: string | null
          image_url: string | null
          status: 'pending' | 'approved' | 'suspended'
          operating_hours: Json
          created_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          name: string
          description?: string | null
          address: string
          city: string
          province?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          email?: string | null
          image_url?: string | null
          status?: 'pending' | 'approved' | 'suspended'
          operating_hours?: Json
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          address?: string
          city?: string
          province?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          email?: string | null
          image_url?: string | null
          status?: 'pending' | 'approved' | 'suspended'
          operating_hours?: Json
        }
        Relationships: []
      }
      services: {
        Row: {
          id: string
          car_wash_id: string
          name: string
          description: string | null
          price: number
          duration_minutes: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          car_wash_id: string
          name: string
          description?: string | null
          price: number
          duration_minutes?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          price?: number
          duration_minutes?: number
          is_active?: boolean
        }
        Relationships: []
      }
      slots: {
        Row: {
          id: string
          car_wash_id: string
          slot_date: string
          start_time: string
          end_time: string
          capacity: number
          bookings_count: number
          created_at: string
        }
        Insert: {
          id?: string
          car_wash_id: string
          slot_date: string
          start_time: string
          end_time: string
          capacity?: number
          bookings_count?: number
          created_at?: string
        }
        Update: {
          slot_date?: string
          start_time?: string
          end_time?: string
          capacity?: number
          bookings_count?: number
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          customer_id: string
          car_wash_id: string
          service_id: string
          slot_id: string
          status: 'confirmed' | 'completed' | 'cancelled'
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_colour: string | null
          vehicle_plate: string | null
          notes: string | null
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          car_wash_id: string
          service_id: string
          slot_id: string
          status?: 'confirmed' | 'completed' | 'cancelled'
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_colour?: string | null
          vehicle_plate?: string | null
          notes?: string | null
          total_price: number
          created_at?: string
        }
        Update: {
          status?: 'confirmed' | 'completed' | 'cancelled'
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_colour?: string | null
          vehicle_plate?: string | null
          notes?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type CarWash = Database['public']['Tables']['car_washes']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Slot = Database['public']['Tables']['slots']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
