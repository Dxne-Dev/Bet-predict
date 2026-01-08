import { Sport } from '../types';

const sports: Sport[] = [
  { id: 'football', name: 'Football' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'tennis', name: 'Tennis' },
  { id: 'esports', name: 'E-Sports' },
  { id: 'nhl', name: 'NHL' },
];

export const sportsDataService = {
  getSports: (): Promise<Sport[]> => {
    return new Promise(resolve => setTimeout(() => resolve(sports), 200));
  },
};