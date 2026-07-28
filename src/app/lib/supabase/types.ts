/**
 * Typesafe Supabase Database Schema Definitions
 * Provides IntelliSense auto-completion for Supabase queries.
 */

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          tc: string;
          phone: string;
          birth_date?: string;
          gender?: string;
          city?: string;
          hearing_loss?: string;
          current_device?: string;
          sgk_status?: string;
          sales_stage?: string;
          notes?: string;
          organization_id?: string;
          branch_id?: string;
          created_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['patients']['Row']>;
      };
      stock_items: {
        Row: {
          id: string;
          name: string;
          category: string;
          brand?: string;
          model?: string;
          serial_number?: string;
          stock_count: number;
          critical_level: number;
          purchase_price: number;
          sale_price: number;
          branch?: string;
          status: string;
          organization_id?: string;
          branch_id?: string;
          created_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['stock_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['stock_items']['Row']>;
      };
      cash_transactions: {
        Row: {
          id: string;
          cash_register_id: string;
          type: 'INCOME' | 'EXPENSE' | 'PAYOUT' | 'TRANSFER' | 'REFUND';
          amount: number;
          category: string;
          reference_entity?: string;
          reference_id?: string;
          branch_id?: string;
          organization_id?: string;
          description?: string;
          created_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['cash_transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['cash_transactions']['Row']>;
      };
      audit_log: {
        Row: {
          id: string;
          user_id?: string;
          user_name?: string;
          action: string;
          module: string;
          description: string;
          details?: string;
          organization_id?: string;
          branch_id?: string;
          created_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['audit_log']['Row']>;
      };
    };
  };
}
