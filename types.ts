
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
