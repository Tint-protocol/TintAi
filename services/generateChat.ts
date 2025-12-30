
import { llm } from './llm';

export const generateChat = async (userPrompt: string, history: any[] = []) => {
  // FIX 4: English logic, multilingual response only if user initiates
  const systemInstruction = `
    SYSTEM_ROLE: TintAI Sovereign Assistant (CHAT_RELAXED_MODE).
    SYSTEM LANGUAGE: The default language is ENGLISH. Use English for all logic and responses unless specified otherwise.
    
    GUIDELINES:
    1. You are a witty, elite, and professional trading mentor.
    2. Respond to general chat, philosophy, or app help.
    3. If the user wants a market analysis, politely direct them to select an asset from the sidebar for a Sovereign Audit.
    4. The default response language is ENGLISH. You may respond in the user's language (e.g. Indonesian) ONLY if they explicitly use it in their prompt.
    
    RESPONSE_SCHEMA:
    Return JSON:
    {
      "text": "Conversational HTML output.",
      "suggestions": ["Ask about TintAI", "How to scan charts"]
    }
  `;

  return await llm.call({
    prompt: userPrompt,
    systemInstruction,
    history,
    temperature: 0.7 // Higher entropy for better conversation
  });
};
