
import { GoogleGenAI, Type } from '@google/genai';
import { Event, Prediction, BetSlip, GoalscorerPrediction, NbaDigitResult, HistoryEntry } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BET_SLIP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Titre du ticket (ex: Combiné Safe, Multi-Score)" },
    analysis: { type: Type.STRING, description: "Brève analyse globale du ticket" },
    bets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          event: { type: Type.STRING, description: "Nom du match (ex: PSG vs OM)" },
          market: { type: Type.STRING, description: "Type de pari (ex: Résultat, Corners)" },
          prediction: { type: Type.STRING, description: "Le pronostic précis (ex: Victoire PSG, +2.5 buts)" },
          justification: { type: Type.STRING, description: "Pourquoi ce choix ?" }
        },
        required: ["event", "market", "prediction"]
      }
    }
  },
  required: ["title", "bets"]
};

const BET_SLIPS_ARRAY_SCHEMA = {
  type: Type.ARRAY,
  items: BET_SLIP_SCHEMA
};

const GOALSCORER_ARRAY_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      playerName: { type: Type.STRING, description: "Nom complet du joueur" },
      teamName: { type: Type.STRING, description: "Équipe du joueur" },
      match: { type: Type.STRING, description: "Affiche du match (ex: Real Madrid vs Barcelone)" },
      league: { type: Type.STRING, description: "Nom de la compétition" },
      confidence: { type: Type.STRING, enum: ["Haute"], description: "Niveau de confiance" },
      justification: { type: Type.STRING, description: "Détails sur sa forme actuelle et probabilité de marquer" }
    },
    required: ["playerName", "teamName", "match", "league", "confidence", "justification"]
  }
};

export const geminiService = {
  getBestChoiceAnalysis: async (sport: string, date: string): Promise<{intro: string, recommendations: any[], conclusion: string}> => {
    // Contexte d'analyse universel Pro++ avec pondération granulaire stricte
    const specializedContext = `
    ### MISSION ANALYSTE SPORTIF PRO++ - PRÉCISION ABSOLUE ###
    Sport : ${sport}. Date : ${date}.
    
    CRITÈRES DE SÉLECTION (Value Detection) :
    Cherche des "COMBINÉS COMPLEXES" (Triptyques ou Duos de statistiques).
    - Football : Résultat + Corners (>10.5) + Cartons (>4.5) ou Buts par mi-temps.
    - Basketball : Résultat + Handicap + Points par Quart-temps.
    - Tennis : Résultat + Nombre de Sets + Tie-break probable.
    - Hockey : Résultat + Tirs cadrés + Powerplays.
    
    LOGIQUE DE CALCUL DE CONFIANCE (Pondération 70% sur facteurs granulaires) :
    Ton score de confiance (0-100) doit impérativement privilégier :
    1. STATS DE NICHE : Moyennes spécifiques (ex: corners concédés par l'adversaire, fautes commises).
    2. FACTEUR HUMAIN/OFFICIEL : Analyse de l'arbitre (sévérité pour les cartons/fautes) ou juge de chaise.
    3. SCÉNARIO TEMPOREL : Analyse par période/mi-temps/set.
    
    Si une recommandation n'inclut pas de justification basée sur ces 3 points, son score de confiance doit être bas.
    
    STRUCTURE DE RÉPONSE :
    Le champ "choice" doit refléter ces combinaisons (ex: "V1 & +11 Corners & +5 Cartons").
    Le champ "reasoning" doit détailler l'analyse de l'arbitre et les stats de niche utilisées.
    `;

    const prompt = `${specializedContext}
    Formatte ta réponse en JSON STRICT selon le schéma de recommandation. Utilise Google Search pour vérifier les officiels du match et les tendances de niche.`;

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
                                market: { type: Type.STRING, description: "Type de combiné (ex: Triptyque Analytique)" },
                                choice: { type: Type.STRING, description: "La combinaison précise (ex: V1 & +10.5 Corners & +4.5 Cartons)" },
                                confidence: { type: Type.NUMBER, description: "Score sur 100 basé sur les stats granulaires" },
                                reasoning: { type: Type.STRING, description: "Justification incluant l'arbitre et les stats de niche" }
                            },
                            required: ["match", "market", "choice", "confidence", "reasoning"]
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

  verifyPredictionResult: async (entry: HistoryEntry): Promise<{actualResults: string, comparison: string, isSuccess: boolean | null}> => {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `### AUDIT POST-MATCH CRITIQUE ###
    Aujourd'hui nous sommes le : ${today}
    Match à vérifier : ${entry.label}
    Pronostics faits par l'IA : ${JSON.stringify(entry.data)}
    
    SCHEMA JSON :
    {
      "actualResults": "Résumé factuel (Score, Corners, Cartons)",
      "comparison": "Analyse du pronostic vs reality",
      "isSuccess": boolean | null
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
            actualResults: { type: Type.STRING },
            comparison: { type: Type.STRING },
            isSuccess: { type: Type.NULL, description: "Use null if match not played or data missing" } 
          }
        }
      }
    });
    
    const rawData = JSON.parse(response.text || '{}');
    return {
        actualResults: rawData.actualResults || "Données indisponibles",
        comparison: rawData.comparison || "Impossible d'établir une comparaison",
        isSuccess: rawData.isSuccess === undefined ? null : rawData.isSuccess
    };
  },

  getSingleEventPrediction: async (event: Event): Promise<Prediction[]> => {
    const prompt = `Analyse expert ${event.teamA.name} vs ${event.teamB.name} le ${event.date}. Google Search. JSON.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json"
        },
    });
    return JSON.parse(response.text || '[]');
  },

  buildTicket: async (sport: string, eventCount: number, dateRange: string): Promise<BetSlip> => {
    const prompt = `Ticket de ${eventCount} matchs ${sport} ${dateRange}. Google Search. JSON.`;
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
    const prompt = `Génère 3 tickets combinés distincts (1 Safe, 1 Risqué, 1 Spéculatif) pour les matchs du ${date}. Utilise Google Search. JSON.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: BET_SLIPS_ARRAY_SCHEMA
        },
    });
    return JSON.parse(response.text || '[]');
  },

  getGoalscorerPredictions: async (date: string, sport: 'football' | 'hockey'): Promise<GoalscorerPrediction[]> => {
    const prompt = `### MISSION CHASSEUR DE BUTEURS ###
    Date : ${date}
    Sport : ${sport === 'football' ? 'Football' : 'Hockey'}
    JSON. Google Search.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: GOALSCORER_ARRAY_SCHEMA
        },
    });
    return JSON.parse(response.text || '[]');
  },

  getNbaDigitPrediction: async (date: string): Promise<NbaDigitResult> => {
    const prompt = `NBA Digit/Total Score pour le ${date}. Google Search. JSON.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
             tools: [{googleSearch: {}}],
             responseMimeType: "application/json"
        }
    });
    return JSON.parse(response.text || '{}');
  },

  getAiRecommendation: async (): Promise<BetSlip[]> => {
    const prompt = `Analyse toutes les opportunités sportives actuelles. 3 tickets combinés. Google Search. JSON.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: BET_SLIPS_ARRAY_SCHEMA
        },
    });
    return JSON.parse(response.text || '[]');
  },

  getFirstHalfTimePrediction: async (event: Event): Promise<Prediction[]> => {
    const prompt = `Focus 1MT : ${event.teamA.name} vs ${event.teamB.name} (${event.date}). Buts/Corners/Cartons. Google Search. JSON.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json"
        },
    });
    return JSON.parse(response.text || '[]');
  }
};
