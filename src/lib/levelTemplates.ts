export interface LevelTemplate {
  name: string
  fielders: number
  continuousBattingOrder: boolean
  inningsPerGame: number
  equityWeights: {
    playing_time: 'none' | 'low' | 'medium' | 'high'
    position_variety: 'none' | 'low' | 'medium' | 'high'
    batting_order_rotation: 'none' | 'low' | 'medium' | 'high'
    infield_outfield_balance: 'none' | 'low' | 'medium' | 'high'
  }
  safetyRules: {
    pitch_count_limits: Array<{ ageMin: number; ageMax: number; max_pitches: number }>
    rest_day_ladder: Array<{ min_pitches: number; max_pitches: number; rest_days: number }>
  }
  positionCategories: {
    battery: string[]
    infield: string[]
    outfield: string[]
    bench: string[]
  }
  hidePositions?: string[]
}

export const LEVEL_TEMPLATES: Record<string, LevelTemplate> = {
  a: {
    name: 'A (Coach Pitch, ~6-7 yrs)',
    fielders: 9,
    continuousBattingOrder: true,
    inningsPerGame: 3,
    equityWeights: {
      playing_time: 'high',
      position_variety: 'high',
      batting_order_rotation: 'high',
      infield_outfield_balance: 'high',
    },
    safetyRules: {
      pitch_count_limits: [],
      rest_day_ladder: [],
    },
    positionCategories: {
      battery: ['C'],
      infield: ['1B', '2B', '3B', 'SS'],
      outfield: ['LF', 'CF', 'RF'],
      bench: ['BENCH', 'BENCH2', 'BENCH3'],
    },
    hidePositions: ['P'],
  },
  aa: {
    name: 'AA (Machine Pitch ~7-8)',
    fielders: 10,
    continuousBattingOrder: true,
    inningsPerGame: 5,
    equityWeights: {
      playing_time: 'high',
      position_variety: 'high',
      batting_order_rotation: 'high',
      infield_outfield_balance: 'high',
    },
    safetyRules: {
      pitch_count_limits: [],
      rest_day_ladder: [],
    },
    positionCategories: {
      battery: ['P', 'RP', 'C'],
      infield: ['1B', '2B', '3B', 'SS'],
      outfield: ['LF', 'LCF', 'RCF', 'RF'],
      bench: ['BENCH', 'BENCH2', 'BENCH3'],
    },
  },
  aaa: {
    name: 'AAA (Kid Pitch ~8-10)',
    fielders: 9,
    continuousBattingOrder: false,
    inningsPerGame: 6,
    equityWeights: {
      playing_time: 'high',
      position_variety: 'medium',
      batting_order_rotation: 'medium',
      infield_outfield_balance: 'medium',
    },
    safetyRules: {
      pitch_count_limits: [
        { ageMin: 7, ageMax: 8, max_pitches: 50 },
        { ageMin: 9, ageMax: 10, max_pitches: 75 },
      ],
      rest_day_ladder: [
        { min_pitches: 1, max_pitches: 20, rest_days: 0 },
        { min_pitches: 21, max_pitches: 35, rest_days: 1 },
        { min_pitches: 36, max_pitches: 50, rest_days: 2 },
        { min_pitches: 51, max_pitches: 65, rest_days: 3 },
        { min_pitches: 66, max_pitches: 1000, rest_days: 4 },
      ],
    },
    positionCategories: {
      battery: ['P', 'C'],
      infield: ['1B', '2B', '3B', 'SS'],
      outfield: ['LF', 'CF', 'RF'],
      bench: ['BENCH', 'BENCH2', 'BENCH3'],
    },
  },
  coast: {
    name: 'Coach (~10-11)',
    fielders: 9,
    continuousBattingOrder: false,
    inningsPerGame: 6,
    equityWeights: {
      playing_time: 'medium',
      position_variety: 'low',
      batting_order_rotation: 'medium',
      infield_outfield_balance: 'low',
    },
    safetyRules: {
      pitch_count_limits: [
        { ageMin: 9, ageMax: 10, max_pitches: 75 },
        { ageMin: 11, ageMax: 12, max_pitches: 85 },
      ],
      rest_day_ladder: [
        { min_pitches: 1, max_pitches: 20, rest_days: 0 },
        { min_pitches: 21, max_pitches: 35, rest_days: 1 },
        { min_pitches: 36, max_pitches: 50, rest_days: 2 },
        { min_pitches: 51, max_pitches: 65, rest_days: 3 },
        { min_pitches: 66, max_pitches: 1000, rest_days: 4 },
      ],
    },
    positionCategories: {
      battery: ['P', 'C'],
      infield: ['1B', '2B', '3B', 'SS'],
      outfield: ['LF', 'CF', 'RF'],
      bench: ['BENCH', 'BENCH2', 'BENCH3'],
    },
  },
  majors: {
    name: 'Majors (~11-12)',
    fielders: 9,
    continuousBattingOrder: false,
    inningsPerGame: 6,
    equityWeights: {
      playing_time: 'medium',
      position_variety: 'low',
      batting_order_rotation: 'medium',
      infield_outfield_balance: 'low',
    },
    safetyRules: {
      pitch_count_limits: [
        { ageMin: 11, ageMax: 12, max_pitches: 85 },
      ],
      rest_day_ladder: [
        { min_pitches: 1, max_pitches: 20, rest_days: 0 },
        { min_pitches: 21, max_pitches: 35, rest_days: 1 },
        { min_pitches: 36, max_pitches: 50, rest_days: 2 },
        { min_pitches: 51, max_pitches: 65, rest_days: 3 },
        { min_pitches: 66, max_pitches: 1000, rest_days: 4 },
      ],
    },
    positionCategories: {
      battery: ['P', 'C'],
      infield: ['1B', '2B', '3B', 'SS'],
      outfield: ['LF', 'CF', 'RF'],
      bench: ['BENCH', 'BENCH2', 'BENCH3'],
    },
  },
}
