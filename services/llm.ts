
import { AIService } from './ai';
import { Type } from "@google/genai";

export class LLMService extends AIService {
  async call(params: {
    prompt: string,
    systemInstruction: string,
    history?: any[],
    imageParts?: any[],
    temperature?: number,
    responseSchema?: any // Allow dynamic schema
  }) {
    const history = params.history || [];
    const currentParts: any[] = [{ text: params.prompt }];
    if (params.imageParts) {
      currentParts.push(...params.imageParts);
    }

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history,
          { role: 'user', parts: currentParts }
        ],
        config: {
          systemInstruction: params.systemInstruction,
          temperature: params.temperature ?? 0.1,
          topP: 0.95,
          responseMimeType: "application/json",
          responseSchema: params.responseSchema || {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING }
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("EMPTY_MODEL_RESPONSE");
      return JSON.parse(text); 
    } catch (error) {
      console.error("LLM Core Fault:", error);
      throw error;
    }
  }
}

export const llm = new LLMService();
