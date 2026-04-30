// Generated from Supabase schema
export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          level: 'single_a' | 'aa' | 'aaa' | 'coast' | 'majors'
          sport: 'baseball' | 'softball'
          season_year: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          level: 'single_a' | 'aa' | 'aaa' | 'coast' | 'majors'
          sport: 'baseball' | 'softball'
          season_year: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          level?: 'single_a' | 'aa' | 'aaa' | 'coast' | 'majors'
          sport?: 'baseball' | 'softball'
          season_year?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'head_coach' | 'assistant_coach'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role: 'head_coach' | 'assistant_coach'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: 'head_coach' | 'assistant_coach'
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          team_id: string
          first_name: string
          last_name: string
          jersey_number: string | null
          preferred_positions: string[] | null
          restricted_positions: string[] | null
          notes: string | null
          development_goals: Record<string, any> | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          first_name: string
          last_name: string
          jersey_number?: string | null
          preferred_positions?: string[] | null
          restricted_positions?: string[] | null
          notes?: string | null
          development_goals?: Record<string, any> | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          first_name?: string
          last_name?: string
          jersey_number?: string | null
          preferred_positions?: string[] | null
          restricted_positions?: string[] | null
          notes?: string | null
          development_goals?: Record<string, any> | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      team_settings: {
        Row: {
          team_id: string
          equity_enabled: boolean
          equity_weights: Record<string, any>
          safety_rules: Record<string, any>
          position_categories: Record<string, any>
          innings_per_game_default: number
          continuous_batting_order: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          team_id: string
          equity_enabled?: boolean
          equity_weights?: Record<string, any>
          safety_rules?: Record<string, any>
          position_categories?: Record<string, any>
          innings_per_game_default?: number
          continuous_batting_order?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          team_id?: string
          equity_enabled?: boolean
          equity_weights?: Record<string, any>
          safety_rules?: Record<string, any>
          position_categories?: Record<string, any>
          innings_per_game_default?: number
          continuous_batting_order?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      games: {
        Row: {
          id: string
          team_id: string
          opponent_name: string
          game_date: string
          location: string | null
          innings_count: number
          status: 'planned' | 'in_progress' | 'complete' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          opponent_name: string
          game_date: string
          location?: string | null
          innings_count?: number
          status?: 'planned' | 'in_progress' | 'complete' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          opponent_name?: string
          game_date?: string
          location?: string | null
          innings_count?: number
          status?: 'planned' | 'in_progress' | 'complete' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      game_attendance: {
        Row: {
          id: string
          game_id: string
          player_id: string
          status: 'attending' | 'absent' | 'maybe'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          status: 'attending' | 'absent' | 'maybe'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          status?: 'attending' | 'absent' | 'maybe'
          created_at?: string
          updated_at?: string
        }
      }
      lineups: {
        Row: {
          id: string
          game_id: string
          batting_order: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          batting_order: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          batting_order?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      position_assignments: {
        Row: {
          id: string
          game_id: string
          inning: number
          player_id: string
          position: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          inning: number
          player_id: string
          position: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          inning?: number
          player_id?: string
          position?: string
          created_at?: string
          updated_at?: string
        }
      }
      pitch_log: {
        Row: {
          id: string
          game_id: string
          player_id: string
          pitch_count: number
          pitched_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          pitch_count: number
          pitched_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          pitch_count?: number
          pitched_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
