
export interface Sport {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface Event {
  id: string;
  sport: string;
  date: string;
  teamA: Team;
  teamB: Team;
}

export interface Prediction {
  market: string;
  prediction: string;
  confidence: 'Faible' | 'Moyenne' | 'Haute';
  justification: string;
}

export interface GoalscorerPrediction {
  playerName: string;
  teamName: string;
  match: string;
  league: string;
  confidence: 'Haute';
  justification: string;
}

export interface Bet {
  event: string;
  market: string;
  prediction: string;
  justification?: string;
}

export interface BetSlip {
  title: string;
  bets: Bet[];
  analysis?: string;
}

export type AppMode = 'pro' | 'proPlus';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  sport: string;
  mode: AppMode;
  type: 'best_choice' | 'single' | 'ticket' | 'nba' | 'goalscorer' | 'mega' | 'first_half' | 'nba_prophecy';
  label: string;
  data: any;
  verification?: {
    actualResults: string;
    comparison: string;
    isSuccess: boolean | null;
    verifiedAt: number;
  };
}

export interface MatchDigitPrediction {
  match: string;
  homeTeam: string;
  awayTeam: string;
  predictedDigit: string;
  predictedTotalScore: string;
  confidence: 'Faible' | 'Moyenne' | 'Haute';
  reasoning: string;
  recentScores: string[];
}

export interface NbaDigitResult {
  date: string;
  predictions: MatchDigitPrediction[];
  globalTrend?: string;
}

export interface NbaProphecyRecommendation {
  match: string;
  player: string;
  bet: string;
  odds: string;
  confidencePercent: number;
  confidenceLevel: string;
  hero: {
    usg: string;
    detail: string;
  };
  faille: {
    dvp: string;
    detail: string;
  };
  scenario: {
    history: string;
    stats: { date: string, opponent: string, stat: string }[];
    detail: string;
  };
  valueAnalysis: {
    estimatedProbability: string;
    impliedOdds: string;
    valueEdge: string;
  };
  risks: string;
}

export interface NbaProphecyResult {
  date: string;
  recommendations: NbaProphecyRecommendation[];
  sources: string[];
  globalNote?: string;
}
