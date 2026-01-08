
import { GoogleGenAI, Type } from '@google/genai';
import { Event, Prediction, BetSlip, GoalscorerPrediction, NbaDigitResult } from '../types';

// Always use a named parameter for apiKey and direct process.env access.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BET_SLIP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    analysis: { type: Type.STRING },
    bets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          event: { type: Type.STRING },
          market: { type: Type.STRING },
          prediction: { type: Type.STRING },
          justification: { type: Type.STRING }
        },
        required: ["event", "market", "prediction"]
      }
    }
  },
  required: ["title", "bets"]
};

const PREDICTION_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      market: { type: Type.STRING },
      prediction: { type: Type.STRING },
      confidence: { type: Type.STRING },
      justification: { type: Type.STRING }
    },
    required: ["market", "prediction", "confidence", "justification"]
  }
};

export const geminiService = {
  getBestChoiceAnalysis: async (sport: string, date: string): Promise<{intro: string, recommendations: any[], conclusion: string}> => {
    const isFootball = sport.toLowerCase().includes('foot');
    
    // Logique de prompt différenciée selon le sport
    const specializedContext = isFootball ? `
    DIRECTIVES ANALYTIQUES SPÉCIFIQUES AU FOOTBALL (PRO++) :
    Ton analyse doit se concentrer EXCLUSIVEMENT sur les marchés de "Résultats du Combiné".
    Tu dois pondérer ton Score de Confiance (0-100) ainsi :
    1. FACTEURS GRANULAIRES (60%) : 
       - CORNERS (30%) : Moyenne par match, tendances par équipe (ailes).
       - CARTONS (30%) : Style de l'arbitre et agressivité défensive.
    2. SCÉNARIO DE MATCH (40%) : 
       - BUTS PAR MI-TEMPS (20%) : Probabilité de score en 1ère/2ème MT.
       - RÉSULTAT FINAL (20%) : V1/X/V2 combiné aux stats ci-dessus.
    
    EXEMPLES DE MARCHÉS REQUIS : 
    - "V1 & Moins de 10 Corners & Plus de 6 Cartons"
    - "Plus de 2.5 Buts & Plus de 8.5 Corners & Plus de 3.5 Cartons"
    - "Penalty accordé aux deux équipes"
    ` : `
    DIRECTIVES ANALYTIQUES POUR LES AUTRES SPORTS (${sport}) :
    Ne propose PAS de marchés de corners ou cartons si ce n'est pas applicable.
    Concentre-toi sur les MARCHÉS DE BASE (Vainqueur, Total Points/Buts, Handicap/Spread).
    Ton Score de Confiance (0-100) doit être pondéré ainsi :
    1. PERFORMANCE PURE (60%) : Efficacité offensive/défensive (ex: FG% en NBA, Ace% au Tennis).
    2. ÉTAT DES EFFECTIFS (20%) : Blessures clés, fatigue (back-to-back), forme sur 5 matchs.
    3. CONTEXTE & ENJEUX (20%) : Historique des face-à-face et importance de la rencontre.
    `;

    const prompt = `Tu es un Agent Décisionnel expert en paris sportifs (Mode Pro++).
    Sport : ${sport}
    Date : ${date}

    ${specializedContext}

    MISSION :
    1. Utilise Google Search pour trouver les rencontres réelles majeures de ${sport} le ${date}.
    2. Identifie les recommandations à haute confiance.
    3. Format de narration requis : "Après avoir analysé [les statistiques spécifiques au sport], je vous recommande pour le marché [X] de choisir [Z] car [Analyse détaillée basée sur les pondérations demandées]... vous maximisez vos chances via [Synthèse]."
    
    FORMAT DE RÉPONSE (JSON) :
    {
      "intro": "Introduction expliquant la méthodologie de scan pour ${sport} le ${date}.",
      "recommendations": [
        {
          "match": "Nom du match",
          "market": "Le marché précis (Combiné pour le Foot, Standard pour les autres)",
          "choice": "L'option recommandée",
          "confidence": "Score de confiance pondéré (0-100)",
          "reasoning": "Analyse complète suivant le format narratif."
        }
      ],
      "conclusion": "Verdict final de l'expert pour cette journée de ${sport}."
    }`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    intro: { type: Type.STRING },
                    recommendations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                match: { type: Type.STRING },
                                market: { type: Type.STRING },
                                choice: { type: Type.STRING },
                                confidence: { type: Type.NUMBER },
                                reasoning: { type: Type.STRING }
                            },
                            required: ["match", "market", "choice", "reasoning"]
                        }
                    },
                    conclusion: { type: Type.STRING }
                },
                required: ["intro", "recommendations", "conclusion"]
            }
        }
    });
    return JSON.parse(response.text || '{}');
  },

  getSingleEventPrediction: async (event: Event): Promise<Prediction[]> => {
    const prompt = `Analyse le match de ${event.sport} : ${event.teamA.name} vs ${event.teamB.name} le ${event.date}.
    INSTRUCTIONS : 1. Recherche sur Google pour confirmer l'événement. 2. Donne 3-4 prédictions. FORMAT : JSON (Tableau d'objets Prediction).`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: PREDICTION_SCHEMA
        },
    });
    return JSON.parse(response.text || '[]');
  },

  buildTicket: async (sport: string, eventCount: number, dateRange: string): Promise<BetSlip> => {
    const prompt = `Utilise Google Search pour trouver ${eventCount} matchs réels de ${sport} ${dateRange}. 
    Crée un ticket de parieur cohérent. Pour chaque match, donne le marché (ex: Vainqueur, Total buts) et la prédiction.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: BET_SLIP_SCHEMA
        },
    });
    return JSON.parse(response.text || '{}');
  },

  generateMegaBets: async (date: string): Promise<BetSlip[]> => {
    const prompt = `Crée 3 combinés de paris (BetSlips) pour les événements sportifs du ${date}. 
    Chaque combiné doit avoir un thème (ex: "Le Safe", "La Grosse Côte", "Spécial Over/Under").`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: BET_SLIP_SCHEMA
          }
        },
    });
    return JSON.parse(response.text || '[]');
  },

  getFirstHalfTimePrediction: async (event: Event): Promise<Prediction[]> => {
    const prompt = `Focus 1ère Mi-Temps. Match: ${event.teamA.name} vs ${event.teamB.name} (${event.date}). FORMAT : Tableau JSON de Predictions.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: PREDICTION_SCHEMA
        },
    });
    return JSON.parse(response.text || '[]');
  },
  
  getAiRecommendation: async (): Promise<BetSlip[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Quels sont les paris les plus sûrs aujourd'hui ? Génère 2 tickets recommandés.",
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: BET_SLIP_SCHEMA
          }
        },
    });
    return JSON.parse(response.text || '[]');
  },

  getGoalscorerPredictions: async (date: string, sport: 'football' | 'hockey'): Promise<GoalscorerPrediction[]> => {
    const prompt = `Top 5 buteurs le ${date}. FORMAT : Tableau JSON GoalscorerPrediction.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                playerName: { type: Type.STRING },
                teamName: { type: Type.STRING },
                match: { type: Type.STRING },
                league: { type: Type.STRING },
                confidence: { type: Type.STRING },
                justification: { type: Type.STRING }
              },
              required: ["playerName", "match", "justification"]
            }
          }
        },
    });
    return JSON.parse(response.text || '[]');
  },

  getNbaDigitPrediction: async (date: string): Promise<NbaDigitResult> => {
    const prompt = `Tu es un expert en probabilités numériques NBA. Analyse CHAQUE MATCH de la nuit du ${date}.
    1. Utilise Google Search pour lister tous les matchs NBA du ${date}.
    2. Pour CHAQUE MATCH, analyse la fréquence d'apparition des chiffres (0-9) dans les scores récents.
    FORMAT : JSON STRICT.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
             tools: [{googleSearch: {}}],
             responseMimeType: "application/json",
             responseSchema: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING },
                    globalTrend: { type: Type.STRING },
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
                                reasoning: { type: Type.STRING },
                                recentScores: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["match", "homeTeam", "awayTeam", "predictedDigit", "predictedTotalScore", "confidence", "reasoning"]
                        }
                    }
                },
                required: ["date", "predictions"]
             }
        }
    });
    return JSON.parse(response.text || '{}');
  }
};
