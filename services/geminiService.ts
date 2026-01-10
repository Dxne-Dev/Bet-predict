
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
    const isFootball = sport.toLowerCase().includes('foot');
    
    const specializedContext = isFootball ? `
    ### MISSION ANALYSTE FOOTBALL PRO++ ###
    Analyse les matchs du ${date}. 
    FOCUS OBLIGATOIRE SUR : Corners (Over/Under), Cartons (Jaunes/Rouges), Stats tirs cadrés et scores multichances.
    Utilise Google Search pour les compos et l'arbitre.` : 
    `ANALYSE SPORTIVE EXPERTE : Focus sur les handicaps et performances individuelles.`;

    const prompt = `Agent Décisionnel ${sport}. Date cible: ${date}. ${specializedContext}
    Formatte ta réponse en JSON STRICT selon le schéma de recommandation.`;

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

  verifyPredictionResult: async (entry: HistoryEntry): Promise<{actualResults: string, comparison: string, isSuccess: boolean | null}> => {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `### AUDIT POST-MATCH CRITIQUE ###
    Aujourd'hui nous sommes le : ${today}
    Match à vérifier : ${entry.label} (Date prévue : ${entry.timestamp ? new Date(entry.timestamp).toISOString().split('T')[0] : 'Inconnue'})
    Pronostics faits par l'IA : ${JSON.stringify(entry.data)}
    
    MISSION DE VÉRIFICATION :
    1. Si le match est prévu APRÈS le ${today}, réponds impérativement que le match n'a pas encore eu lieu. isSuccess doit être NULL.
    2. Ne compare JAMAIS avec des matchs passés (ex: 2024) pour valider une date future (ex: 2026).
    3. Si le match a été joué, trouve les scores et stats exactes.
    4. SI LE MATCH N'A PAS EU LIEU OU SI LES DONNÉES SONT INCERTAINES, isSuccess DOIT ÊTRE null (ET NON PAS false).
    5. Un échec (false) ne doit être attribué QUE si le match a eu lieu et que le pronostic est faux.
    
    SCHEMA JSON :
    {
      "actualResults": "Résumé factuel (Match non joué / Score X-X)",
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
    const prompt = `Génère 3 tickets combinés distincts (1 Safe, 1 Risqué, 1 Spéculatif) pour les matchs du ${date}. Utilise Google Search pour trouver les meilleures affiches du jour. Formate en tableau JSON selon le schéma.`;
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
    Sport : ${sport === 'football' ? 'Football (Championnats Européens)' : 'Hockey sur Glace (NHL)'}
    
    1. Utilise Google Search pour identifier les matchs réels prévus le ${date}.
    2. Trouve 5 joueurs (Buteurs) ayant une probabilité maximale de marquer selon leur forme récente et l'adversaire.
    3. NE LAISSE AUCUN CHAMP VIDE.
    4. Formate impérativement en JSON selon le schéma strict fourni.`;

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
    const prompt = `Analyse toutes les opportunités sportives actuelles dans le monde. Génère 3 tickets combinés hautement rentables basés sur des statistiques réelles. Google Search requis. Formate en tableau JSON selon le schéma.`;
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
