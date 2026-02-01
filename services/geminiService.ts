import { GoogleGenAI, Type } from "@google/genai";
import { GameEvent } from '../types';

let genAI: GoogleGenAI | null = null;

export const initGemini = (apiKey: string) => {
  genAI = new GoogleGenAI({ apiKey });
};

export const analyzeChatBatch = async (messages: string[]): Promise<GameEvent | null> => {
  if (!genAI || messages.length === 0) return null;

  try {
    const prompt = `
      You are the Game Master of a physics mining game. 
      Analyze the following chat messages from Twitch users.
      Based on the collective sentiment or specific requests, trigger an in-game event.
      
      Messages:
      ${messages.map(m => `- ${m}`).join('\n')}

      Available Actions:
      - SPAWN_BALLS: If users are excited, saying "drop", "pog", or asking for items.
      - SPAWN_TNT: If users are chaotic, angry, saying "boom", "explode", or "destroy".
      - HEAL_PICKAXE: If users are supportive, saying "heal", "save", "love".
      - COMMENTARY: If nothing specific, just provide a short, snarky, or hyping comment about the mining progress (max 10 words).

      Return JSON.
    `;

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ['SPAWN_BALLS', 'SPAWN_TNT', 'HEAL_PICKAXE', 'COMMENTARY'] },
            data: { type: Type.STRING, description: "Commentary text if action is COMMENTARY, or count for spawn" },
            reason: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GameEvent;
    }
    return null;

  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const getAchievementComment = async (ore: string, depth: number): Promise<string> => {
  if (!genAI) return `Wow! Found ${ore}!`;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The player just mined ${ore} at depth ${depth}. Give a very short (max 5 words) hype reaction.`,
    });
    return response.text?.trim() || `Found ${ore}!`;
  } catch (e) {
    return `Found ${ore}!`;
  }
};