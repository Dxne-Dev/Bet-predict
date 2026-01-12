
import { GoogleGenAI, Type } from '@google/genai';
import { Event, Prediction, BetSlip, GoalscorerPrediction, NbaDigitResult, HistoryEntry, NbaProphecyResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_CORE = `
VOUS ÊTES UN ANALYSTE SPORTIF DE HAUTE PRÉCISION ET UN AUDITEUR DE DONNÉES.
RÈGLES D'OR ANTI-HALLUCINATION ET PRÉCISION TEMPORELLE :
1. VÉRIFICATION DU CALENDRIER : Votre PREMIÈRE action est de trouver le calendrier RÉEL via Google Search (ESPN, NBA.com).
2. ALIGNEMENT DATE STRICT : Si l'utilisateur demande le 13/01, vous devez UNIQUEMENT traiter les matchs dont le coup d'envoi (Tip-off) a lieu le 13/01 à l'heure locale américaine (ET/PT).
3. INTERDICTION DU "LENDEMAIN" : Ne proposez JAMAIS de matchs se jouant le 14/01 sous prétexte qu'ils commencent tôt le matin. Si le calendrier US affiche 0 match pour la date précise, retournez un résultat vide.
4. EXPERTISE : Vous agissez en tant qu'assistant impartial, factuel, spécialisé dans les player props via la méthode des 3 clés.
`;

const PROPHECY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          match: { type: Type.STRING },
          player: { type: Type.STRING },
          bet: { type: Type.STRING },
          odds: { type: Type.STRING },
          confidencePercent: { type: Type.NUMBER },
          confidenceLevel: { type: Type.STRING },
          hero: {
            type: Type.OBJECT,
            properties: {
              usg: { type: Type.STRING },
              detail: { type: Type.STRING }
            },
            required: ["usg", "detail"]
          },
          faille: {
            type: Type.OBJECT,
            properties: {
              dvp: { type: Type.STRING },
              detail: { type: Type.STRING }
            },
            required: ["dvp", "detail"]
          },
          scenario: {
            type: Type.OBJECT,
            properties: {
              history: { type: Type.STRING },
              stats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    opponent: { type: Type.STRING },
                    stat: { type: Type.STRING }
                  }
                }
              },
              detail: { type: Type.STRING }
            },
            required: ["history", "detail"]
          },
          valueAnalysis: {
             type: Type.OBJECT,
             properties: {
                estimatedProbability: { type: Type.STRING },
                impliedOdds: { type: Type.STRING },
                valueEdge: { type: Type.STRING }
             },
             required: ["estimatedProbability", "impliedOdds", "valueEdge"]
          },
          risks: { type: Type.STRING }
        },
        required: ["match", "player", "bet", "hero", "faille", "scenario", "confidencePercent", "valueAnalysis"]
      }
    },
    sources: { type: Type.ARRAY, items: { type: Type.STRING } },
    globalNote: { type: Type.STRING }
  },
  required: ["date", "recommendations", "sources"]
};

export const geminiService = {
  getNbaProphecy: async (date: string): Promise<NbaProphecyResult> => {
    const prompt = `
    Tu es un analyste expert en NBA et en paris sportifs, spécialisé dans l'analyse de player props en utilisant une méthode rigoureuse : les 3 clés (Le Héros, La Faille, Le Scénario).
    
    MISSION : Analyser les matchs NBA du ${date} (Date US) et identifier le TOP 3 des opportunités validant TOUS les critères stricts.

    CRITÈRES STRICTS A VALIDER (LES 3 CLÉS) :
    1. CLÉ 1 : LE HÉROS (Usage Rate)
       - USG% > 30% obligatoire. Joueur titulaire dominant.
    
    2. CLÉ 2 : LA FAILLE (Défense adverse)
       - L'équipe adverse doit être dans le BOTTOM 7 en DvP (Defense vs Position) ou Points Allowed pour la position du joueur.
    
    3. CLÉ 3 : LE SCÉNARIO (Historique & Prophétie)
       - Historique > 85% de réussite sur les 10-20 derniers matchs dans des conditions similaires (vs bottom defense).
       - Value Mathématique : La probabilité estimée par l'IA doit être supérieure à la probabilité implicite de la cote.

    INSTRUCTIONS D'EXÉCUTION :
    1. Utilise Google Search pour trouver le calendrier officiel NBA du ${date}.
    2. Pour chaque match, cherche les stats USG% et les classements défensifs (DvP) actuels.
    3. Sélectionne UNIQUEMENT les joueurs qui cochent les 3 cases.
    4. Si moins de 3 joueurs valident tout, n'en renvoie que 1 ou 2. Si aucun, renvoie une liste vide avec une note explicative.
    5. Sois extrêmement précis sur les chiffres (Cotes, USG, DvP Rank).

    FORMAT DE RÉPONSE ATTENDU (JSON) :
    Remplis le schéma JSON fourni avec précision. 
    Dans 'valueAnalysis', calcule :
    - estimatedProbability: Ton estimation en % (ex: "85%")
    - impliedOdds: Probabilité implicite de la cote moyenne du marché (ex: cote 1.85 = "54%")
    - valueEdge: La différence (ex: "+31%")
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: PROPHECY_SCHEMA
      }
    });
    return JSON.parse(response.text || '{"recommendations": [], "sources": []}');
  },

  getBestChoiceAnalysis: async (sport: string, date: string) => {
    const prompt = `${SYSTEM_CORE}
    ANALYSE PRO++ : ${sport} le ${date}. 
    Vérifiez les matchs RÉELS via Google Search. Si aucun match le ${date}, ne proposez rien pour ce jour.`;

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
    NBA DIGIT : Matchs du ${date} (Date US uniquement). 
    Identifiez les rencontres RÉELLES via ESPN. Ne débordez pas sur le lendemain.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
             tools: [{googleSearch: {}}],
             responseMimeType: "application/json",
             responseSchema: {
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
                      reasoning: { type: Type.STRING },
                      recentScores: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["match", "homeTeam", "awayTeam", "predictedDigit", "predictedTotalScore", "confidence", "reasoning", "recentScores"]
                  }
                },
                globalTrend: { type: Type.STRING }
              },
              required: ["date", "predictions"]
            }
        }
    });
    return JSON.parse(response.text || '{"predictions": []}');
  },

  buildTicket: async (sport: string, eventCount: number, dateRange: string): Promise<BetSlip> => {
    const prompt = `${SYSTEM_CORE}
    CONSTRUISEZ UN TICKET de ${eventCount} matchs RÉELS de ${sport} (${dateRange}).`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: {
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
          }
        },
    });
    return JSON.parse(response.text || '{"title": "Ticket Auto", "bets": []}');
  },

  generateMegaBets: async (date: string): Promise<BetSlip[]> => {
    const prompt = `${SYSTEM_CORE}
    GÉNÉREZ 3 TICKETS pour le ${date} basés sur des matchs RÉELS de ce jour précis.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json",
          responseSchema: { 
            type: Type.ARRAY, 
            items: {
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
            } 
          }
        },
    });
    return JSON.parse(response.text || '[]');
  },

  getAiRecommendation: async (): Promise<BetSlip[]> => {
    const prompt = `${SYSTEM_CORE}
    TOP OPPORTUNITÉS du jour (Matchs RÉELS uniquement).`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json"
        },
    });
    return JSON.parse(response.text || '[]');
  },

  getSingleEventPrediction: async (event: Event): Promise<Prediction[]> => {
    const prompt = `${SYSTEM_CORE}
    PRONO MATCH RÉEL : ${event.teamA.name} vs ${event.teamB.name} le ${event.date}.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { tools: [{googleSearch: {}}], responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || '[]');
  },

  getGoalscorerPredictions: async (date: string, sport: 'football' | 'hockey'): Promise<GoalscorerPrediction[]> => {
    const prompt = `${SYSTEM_CORE}
    BUTEURS RÉELS : ${sport} le ${date}.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{googleSearch: {}}], responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || '[]');
  },

  getFirstHalfTimePrediction: async (event: Event): Promise<Prediction[]> => {
    const prompt = `${SYSTEM_CORE}
    MI-TEMPS MATCH RÉEL : ${event.teamA.name} vs ${event.teamB.name} le ${event.date}.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{googleSearch: {}}], responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || '[]');
  },

  verifyPredictionResult: async (entry: HistoryEntry) => {
    const prompt = `${SYSTEM_CORE}
    VÉRIFICATION RÉSULTAT RÉEL : ${entry.label}.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { tools: [{googleSearch: {}}], responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  }
};
