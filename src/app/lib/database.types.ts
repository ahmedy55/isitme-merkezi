export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          phone: string | null
          email: string | null
          address: string | null
          tax_no: string | null
          plan_type: 'trial' | 'basic' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'suspended' | 'cancelled'
          trial_ends_at: string | null
          max_users: number
          max_branches: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      branches: {
        Row: {
          id: string
          organization_id: string
          name: string
          address: string | null
          phone: string | null
          status: 'active' | 'inactive'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['branches']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['branches']['Insert']>
      }
      memberships: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          roles: string[]
          branch_id: string | null
          status: 'active' | 'inactive' | 'invited'
          invited_at: string | null
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['memberships']['Row'], 'id' | 'joined_at'> & {
          id?: string
          joined_at?: string
        }
        Update: Partial<Database['public']['Tables']['memberships']['Insert']>
      }
      patients: {
        Row: {
          id: string
          organization_id: string
          tc: string
          first_name: string
          last_name: string
          phone: string
          email: string | null
          birth_date: string | null
          gender: 'Erkek' | 'Kadın' | null
          address: string | null
          hearing_loss: 'Hafif' | 'Orta' | 'İleri' | 'Çok İleri' | null
          hearing_loss_side: 'Sol' | 'Sağ' | 'Her İki Kulak' | null
          current_device: string | null
          device_date: string | null
          sgk_status: 'Aktif' | 'Pasif' | 'Yenileme Hakkı Var' | null
          sgk_renewal_date: string | null
          sgk_insurance_status: string | null
          patient_status: string
          source: string | null
          sales_stage: string | null
          doctor_name: string | null
          prescription_status: string | null
          prescription_no: string | null
          report_no: string | null
          battery_size: string | null
          daily_usage_hours: number | null
          last_battery_purchase: string | null
          battery_pack_count: number | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          next_action: string | null
          notes: string | null
          audiogram_left: number[] | null
          audiogram_right: number[] | null
          past_audiogram_left: number[] | null
          past_audiogram_right: number[] | null
          last_visit: string | null
          consent_given: boolean
          consent_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['patients']['Insert']>
      }
      platform_admins: {
        Row: {
          id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['platform_admins']['Insert']>
      }
    }
  }
}
