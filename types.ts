
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
