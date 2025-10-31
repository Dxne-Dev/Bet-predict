import { GoogleGenAI } from '@google/genai';
import { Event, Prediction, BetSlip } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Extracts a JSON object from a string that might contain markdown code fences.
 * @param text The text response from the AI.
 * @returns The clean JSON string.
 */
function extractJson(text: string): string | null {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    if (match && match[1]) {
        return match[1].trim();
    }
     // Fallback for responses that might just be the JSON string without fences
    if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
        return text.trim();
    }
    return null;
}


export const geminiService = {
  getSingleEventPrediction: async (event: Event): Promise<Prediction[]> => {
    const prompt = `Tu es un puissant analyste de paris sportifs. Ta tâche est de fournir des prédictions précises basées sur des données vérifiées via une recherche web.

**ACTION REQUISE :**
1.  **Vérification via Recherche Google :** Utilise l'outil de recherche Google pour confirmer **SANS AUCUN DOUTE** que le match de ${event.sport} entre ${event.teamA.name} et ${event.teamB.name} est officiellement programmé pour le ${event.date}. C'est l'étape la plus critique.
2.  **Scénarios de Réponse :**
    *   **Si la recherche ne confirme PAS le match** à cette date, ta seule et unique réponse doit être un bloc de code JSON contenant un tableau vide: \`\`\`json\n[]\n\`\`\`
    *   **Si la recherche CONFIRME le match :** Procède à une analyse approfondie. NE PAS INVENTER de statistiques. Fournis des prédictions pour les marchés de paris courants.

**FORMAT DE SORTIE STRICT :**
La sortie doit être **exclusivement** un bloc de code JSON valide contenant un **tableau** d'objets de prédiction. Ne rien inclure d'autre.

**Schéma JSON pour chaque objet Prediction :**
\`\`\`
{
  "market": "string",
  "prediction": "string",
  "confidence": "Faible" | "Moyenne" | "Haute",
  "justification": "string"
}
\`\`\`

**Exemple de réponse valide :**
\`\`\`json
[
  {
    "market": "Vainqueur du match",
    "prediction": "${event.teamA.name}",
    "confidence": "Haute",
    "justification": "L'équipe A est sur une série de 5 victoires et joue à domicile."
  },
  {
    "market": "Total de Buts",
    "prediction": "Plus de 2.5",
    "confidence": "Moyenne",
    "justification": "Les deux équipes ont des attaques prolifiques cette saison."
  }
]
\`\`\`
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        },
    });

    const jsonString = extractJson(response.text);
    if (!jsonString) {
        if (response.text.trim() === '[]') return [];
        throw new Error("Impossible d'extraire le JSON de la réponse de l'IA.");
    }
    
    const parsedData = JSON.parse(jsonString);

    if (Array.isArray(parsedData)) {
      return parsedData as Prediction[];
    }
    
    if (typeof parsedData === 'object' && parsedData !== null) {
      if (Object.keys(parsedData).length === 0) {
        return [];
      }
      return [parsedData] as Prediction[];
    }
    
    throw new Error("La réponse de l'IA n'est ni un tableau ni un objet de prédiction valide.");
  },

  buildTicket: async (sport: string, eventCount: number, dateRange: string): Promise<BetSlip> => {
    const prompt = `Agis en tant qu'analyste de paris sportifs spécialisé dans la création de combinés sécurisés.
    
**ACTION REQUISE :**
1.  **Recherche d'Événements Réels :** Utilise l'outil de recherche Google pour trouver ${eventCount} matchs réels et confirmés de ${sport} qui auront lieu ${dateRange}. Concentre-toi sur les ligues majeures et bien connues. Ta sélection doit se baser **uniquement** sur des événements que tu as pu vérifier via la recherche.
2.  **Analyse et Sélection :** Pour chaque match réel trouvé, identifie le pari qui te semble le plus sûr et le plus probable.
3.  **Construction du Ticket :** Crée un ticket combiné avec ces ${eventCount} sélections.

**FORMAT DE SORTIE STRICT :**
Formate ta réponse **exclusivement** en un unique bloc de code JSON valide qui est un objet BetSlip. Ne fournis aucun texte avant ou après.

**Schéma JSON de l'objet BetSlip :**
\`\`\`
{
  "title": "string",
  "analysis": "string",
  "bets": [
    {
      "event": "string (doit inclure la ligue, ex: 'Real Madrid vs FC Barcelone (La Liga)')",
      "market": "string",
      "prediction": "string",
      "justification": "string"
    }
  ]
}
\`\`\`

**Exemple de réponse valide :**
\`\`\`json
{
  "title": "Combiné Fiable - ${sport}",
  "analysis": "Ce combiné se concentre sur des favoris jouant à domicile, minimisant les risques.",
  "bets": [
    {
      "event": "Manchester City vs Burnley (Premier League)",
      "market": "Vainqueur",
      "prediction": "Manchester City",
      "justification": "City est invaincu à domicile et affronte une équipe en difficulté."
    },
    {
      "event": "Bayern Munich vs Bochum (Bundesliga)",
      "market": "Total de Buts",
      "prediction": "Plus de 2.5",
      "justification": "Le Bayern a la meilleure attaque du championnat."
    }
  ]
}
\`\`\`
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        },
    });
    
    const jsonString = extractJson(response.text);
    if (!jsonString) {
        throw new Error("Impossible d'extraire le JSON de la réponse de l'IA pour le ticket.");
    }
    
    const parsedData = JSON.parse(jsonString);

    if (Array.isArray(parsedData) && parsedData.length > 0) {
      return parsedData[0] as BetSlip;
    }

    if (typeof parsedData === 'object' && parsedData !== null && !Array.isArray(parsedData)) {
      return parsedData as BetSlip;
    }

    throw new Error("La réponse de l'IA n'est pas un objet de ticket valide.");
  },

  generateMegaBets: async (date: string): Promise<BetSlip[]> => {
     const prompt = `Agis en tant qu'analyste expert en paris sportifs à la recherche de "méga-paris".

**ACTION REQUISE :**
1.  **Recherche d'Événements Majeurs :** Utilise l'outil de recherche Google pour identifier les principaux événements sportifs réels (tous sports confondus, en se concentrant sur les ligues majeures) qui se dérouleront à la date du ${date}.
2.  **Création de Combinés :** Crée TROIS propositions de paris combinés distincts à partir des matchs trouvés. Chaque combiné doit contenir entre 4 et 6 événements.
3.  **Analyse :** Pour chaque proposition, fournis une analyse globale.

**FORMAT DE SORTIE STRICT :**
Formate ta réponse **exclusivement** en un unique bloc de code JSON contenant un tableau de trois objets "BetSlip". Ne fournis aucun texte avant ou après.

**Schéma JSON pour chaque objet BetSlip :**
\`\`\`
{
  "title": "string",
  "analysis": "string",
  "bets": [
    {
      "event": "string (doit inclure la ligue, ex: 'Real Madrid vs FC Barcelone (La Liga)')",
      "market": "string",
      "prediction": "string",
      "justification": "string"
    }
  ]
}
\`\`\`

**Exemple de réponse valide :**
\`\`\`json
[
  {
    "title": "Le Combiné des Buteurs",
    "analysis": "Ce ticket mise sur les matchs où les deux équipes sont susceptibles de marquer.",
    "bets": [
      {
        "event": "Naples vs Inter Milan (Serie A)",
        "market": "Les deux équipes marquent",
        "prediction": "Oui",
        "justification": "Deux des meilleures attaques de Serie A s'affrontent."
      },
      {
        "event": "Dortmund vs Leipzig (Bundesliga)",
        "market": "Total de Buts",
        "prediction": "Plus de 3.5",
        "justification": "Les matchs entre ces deux équipes sont souvent riches en buts."
      }
    ]
  },
  {
    "title": "La Surprise du Chef",
    "analysis": "Un combiné plus risqué qui tente de trouver de la valeur sur des outsiders.",
    "bets": [
      {
        "event": "Lille vs Lyon (Ligue 1)",
        "market": "Résultat",
        "prediction": "Match Nul",
        "justification": "Deux équipes de niveau très proche qui pourraient se neutraliser."
      },
      {
        "event": "Atletico Madrid vs Real Sociedad (La Liga)",
        "market": "Moins de 2.5 buts",
        "prediction": "Oui",
        "justification": "L'Atletico est connu pour sa défense solide, surtout à domicile."
      }
    ]
  }
]
\`\`\`
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
             tools: [{googleSearch: {}}],
        },
    });
    
    const jsonString = extractJson(response.text);
     if (!jsonString) {
        throw new Error("Impossible d'extraire le JSON de la réponse de l'IA pour les méga-paris.");
    }
    
    const parsedData = JSON.parse(jsonString);

    if (Array.isArray(parsedData)) {
      return parsedData as BetSlip[];
    }

    if (typeof parsedData === 'object' && parsedData !== null) {
      return [parsedData] as BetSlip[];
    }

    throw new Error("La réponse de l'IA n'est pas un tableau de méga-paris valide.");
  },
  
  getAiRecommendation: async (): Promise<BetSlip[]> => {
    const prompt = `Agis en tant qu'expert et analyste de paris sportifs de classe mondiale. Ta mission est de fournir tes meilleures recommandations de paris combinés, sans te limiter à une date ou un sport spécifique.

**ACTION REQUISE :**
1.  **Recherche Globale :** Utilise l'outil de recherche Google pour scanner les événements sportifs à venir (dans les prochains jours) sur plusieurs sports majeurs (Football, Basketball, NFL, etc.).
2.  **Identification des "Pépites" :** Identifie 1 à 3 paris combinés qui présentent le meilleur ratio sécurité/potentiel de gain. Ces choix doivent être basés sur une analyse profonde et des données vérifiables. Ce sont TES recommandations personnelles en tant qu'expert.
3.  **Justification :** Chaque combiné doit avoir une analyse claire expliquant la stratégie (ex: "Combiné des favoris solides", "Pari sur les matchs à buts", etc.). Chaque pari individuel doit être justifié.

**FORMAT DE SORTIE STRICT :**
Formate ta réponse **exclusivement** en un unique bloc de code JSON contenant un tableau d'objets "BetSlip". Ne fournis aucun texte avant ou après.

**Schéma JSON pour chaque objet BetSlip :**
\`\`\`
{
  "title": "string",
  "analysis": "string",
  "bets": [
    {
      "event": "string (doit inclure la ligue, ex: 'Real Madrid vs FC Barcelone (La Liga)')",
      "market": "string",
      "prediction": "string",
      "justification": "string"
    }
  ]
}
\`\`\`

**Exemple de réponse valide :**
\`\`\`json
[
  {
    "title": "La Recommandation de Confiance de l'IA",
    "analysis": "Ce combiné est basé sur des équipes en grande forme qui affrontent des adversaires plus faibles, maximisant les chances de succès.",
    "bets": [
      {
        "event": "Boston Celtics vs Detroit Pistons (NBA)",
        "market": "Écart de points",
        "prediction": "Boston Celtics -8.5",
        "justification": "Les Celtics dominent la conférence Est tandis que les Pistons sont en phase de reconstruction."
      },
      {
        "event": "Arsenal vs Sheffield United (Premier League)",
        "market": "Vainqueur",
        "prediction": "Arsenal",
        "justification": "Arsenal est un prétendant au titre et joue à domicile contre le dernier du classement."
      }
    ]
  }
]
\`\`\`
`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
             tools: [{googleSearch: {}}],
        },
    });
    
    const jsonString = extractJson(response.text);
     if (!jsonString) {
        throw new Error("Impossible d'extraire le JSON de la réponse de l'IA pour les recommandations.");
    }
    
    const parsedData = JSON.parse(jsonString);

    if (Array.isArray(parsedData)) {
      return parsedData as BetSlip[];
    }

    if (typeof parsedData === 'object' && parsedData !== null) {
      return [parsedData] as BetSlip[];
    }

    throw new Error("La réponse de l'IA n'est pas un tableau de recommandations valide.");
  }
};