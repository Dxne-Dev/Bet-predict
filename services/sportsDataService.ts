import { Sport } from '../types';

const sports: Sport[] = [
  { id: 'football', name: 'Football' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'tennis', name: 'Tennis' },
  { id: 'esports', name: 'E-Sports' },
];

export const sportsDataService = {
  getSports: (): Promise<Sport[]> => {
    return new Promise(resolve => setTimeout(() => resolve(sports), 200));
  },
};
