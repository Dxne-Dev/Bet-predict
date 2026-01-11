
import { GoogleGenAI, Type } from '@google/genai';
import { Event, Prediction, BetSlip, GoalscorerPrediction, NbaDigitResult, HistoryEntry } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_CORE = `
VOUS ÊTES UN ANALYSTE SPORTIF DE HAUTE PRÉCISION.
RÈGLES CRITIQUES :
1. RECHERCHE ACTIVE : Utilisez Google Search pour trouver des matchs réels. 
2. FLEXIBILITÉ DE DATE : Si aucun match n'est trouvé pour la date exacte demandée, cherchez les matchs les plus proches dans les 7 jours à venir. NE LAISSEZ JAMAIS UN TICKET VIDE.
3. FORMATAGE : Ne mentionnez JAMAIS vos protocoles internes (ex: "Anti-hallucination", "Confirmed event") dans les textes destinés à l'utilisateur. 
4. CONTENU : Le champ 'analysis' doit être un résumé sportif motivant, pas une explication technique de vos recherches.
5. NBA/US SPORTS : Vérifiez toujours la nuit de match correspondante au fuseau horaire US.
`;

const BET_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    event: { type: Type.STRING, description: "Nom des équipes (ex: Lakers vs Warriors)" },
    market: { type: Type.STRING, description: "Type de pari (ex: Total Points)" },
    prediction: { type: Type.STRING, description: "Le pronostic précis" },
    justification: { type: Type.STRING, description: "Brève explication technique" }
  },
  required: ["event", "market", "prediction"]
};

const BET_SLIP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    analysis: { type: Type.STRING },
    bets: {
      type: Type.ARRAY,
      items: BET_SCHEMA,
      minItems: 1
    }
  },
  required: ["title", "bets"]
};

const NBA_DIGIT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING },
    predictions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          match: { type: Type.STRING },
          homeTeam: { type: Type.STRING },
          awayTeam: { type: Type.STRING },
          predictedDigit: { type: Type.STRING },
          predictedTotalScore: { type: Type.STRING },
          confidence: { type: Type.STRING },
          reasoning: { type: Type.STRING, description: "Analyse ultra-détaillée des tendances de scoring récentes, séries de victoires/défaites, et statistiques défensives." },
          recentScores: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste des 3 à 5 derniers scores réels des équipes." }
        },
        required: ["match", "homeTeam", "awayTeam", "predictedDigit", "predictedTotalScore", "confidence", "reasoning", "recentScores"]
      }
    },
    globalTrend: { type: Type.STRING }
  },
  required: ["date", "predictions"]
};

export const geminiService = {
  getBestChoiceAnalysis: async (sport: string, date: string) => {
    const prompt = `${SYSTEM_CORE}
    ANALYSE PRO++ : ${sport} le ${date}. 
    Si vide le ${date}, prenez les meilleures affiches de la semaine. 
    Fournissez 3 recommandations ultra-détaillées.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
            responseMimeType: "application/json"
        }
    });
    return JSON.parse(response.text || '{"dataFound": false, "recommendations": []}');
  },

  getNbaDigitPrediction: async (date: string) => {
    const prompt = `${SYSTEM_CORE}
    NBA DIGIT & TREND ANALYST : Matchs du ${date} (heure US). 
    1. Identifiez les rencontres réelles sur ESPN/NBA.com.
    2. Pour chaque match, analysez les 5 dernières performances.
    3. ENRICHISSEZ la 'reasoning' : incluez des détails spécifiques sur les tendances de scoring (ex: 'Série de 4 matchs à plus de 115 points', 'Défense en difficulté à l'extérieur', 'Rythme de jeu accéléré par le retour d'un meneur'). 
    4. Expliquez comment ces tendances numériques justifient le choix du 'digit' et du score total.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
             tools: [{googleSearch: {}}],
             responseMimeType: "application/json",
             responseSchema: NBA_DIGIT_SCHEMA
        }
    });
    return JSON.parse(response.text || '{"predictions": []}');
  },

  buildTicket: async (sport: string, eventCount: number, dateRange: string): Promise<BetSlip> => {
    const prompt = `${SYSTEM_CORE}
    CONSTRUISEZ UN TICKET de ${eventCount} matchs de ${sport} (${dateRange}).
    Si la date est vide, élargissez la recherche aux 7 prochains jours. 
    REMPLISSEZ impérativement le tableau 'bets'.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: BET_SLIP_SCHEMA
        },
    });
    return JSON.parse(response.text || '{"title": "Ticket Auto", "bets": []}');
  },

  generateMegaBets: async (date: string): Promise<BetSlip[]> => {
    const prompt = `${SYSTEM_CORE}
    GÉNÉREZ 3 TICKETS (Safe, Medium, Risqué) pour le ${date}. 
    Si le calendrier du ${date} est pauvre, incluez les chocs du week-end le plus proche.
    Chaque ticket doit avoir au moins 2 paris réels.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: BET_SLIP_SCHEMA }
        },
    });
    return JSON.parse(response.text || '[]');
  },

  getAiRecommendation: async (): Promise<BetSlip[]> => {
    const prompt = `${SYSTEM_CORE}
    TOP OPPORTUNITÉS : Identifiez les 3 meilleures affiches mondiales de la semaine. 
    Vérifiez les cotes et les absences via Google Search.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: BET_SLIP_SCHEMA }
        },
    });
    return JSON.parse(response.text || '[]');
  },

  getSingleEventPrediction: async (event: Event): Promise<Prediction[]> => {
    const prompt = `${SYSTEM_CORE}
    PRONO MATCH : ${event.teamA.name} vs ${event.teamB.name} le ${event.date}.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { tools: [{googleSearch: {}}], responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || '[]');
  },

  getGoalscorerPredictions: async (date: string, sport: 'football' | 'hockey'): Promise<GoalscorerPrediction[]> => {
    const prompt = `${SYSTEM_CORE}
    BUTEURS : ${sport} le ${date}. Vérifiez les titulaires probables.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{googleSearch: {}}], responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || '[]');
  },

  getFirstHalfTimePrediction: async (event: Event): Promise<Prediction[]> => {
    const prompt = `${SYSTEM_CORE}
    MI-TEMPS : ${event.teamA.name} vs ${event.teamB.name}.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{googleSearch: {}}], responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || '[]');
  },

  verifyPredictionResult: async (entry: HistoryEntry) => {
    const prompt = `${SYSTEM_CORE}
    VÉRIFICATION RÉSULTAT : ${entry.label}.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { tools: [{googleSearch: {}}], responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  }
};
