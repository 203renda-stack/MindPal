import { GoogleGenAI, Chat, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { MoodEntry } from '../types';

let chatSession: Chat | null = null;
let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const initializeChat = () => {
  const genAI = getAI();
  chatSession = genAI.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    initializeChat();
  }
  try {
    if (!chatSession) throw new Error("Chat session not initialized");
    const result = await chatSession.sendMessage({ message });
    return result.text || "抱歉，我现在有点累，请稍后再试。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "连接似乎出了点问题，我们能重新开始吗？";
  }
};

export const analyzeMoodFromHistory = async (historyText: string): Promise<MoodEntry | null> => {
  const genAI = getAI();
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on the following conversation log, analyze the user's dominant emotion and intensity (1-10). 
      Log: ${historyText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "Current date in YYYY-MM-DD format" },
            score: { type: Type.NUMBER, description: "Mood score from 1 (Very Sad) to 10 (Very Happy)" },
            emotion: { type: Type.STRING, description: "One word emotion description in Chinese (e.g. 焦虑, 平静)" },
            notes: { type: Type.STRING, description: "A very brief 1 sentence summary of why they feel this way." }
          },
          required: ["date", "score", "emotion", "notes"]
        }
      }
    });
    
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as MoodEntry;
  } catch (e) {
    console.error("Mood Analysis Failed", e);
    return null;
  }
};