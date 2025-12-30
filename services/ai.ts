
import { GoogleGenAI } from "@google/genai";

export class AIService {
  protected client: GoogleGenAI;
  protected modelName = 'gemini-3-pro-preview';

  constructor() {
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  protected getModel() {
    return this.client.models;
  }
}
