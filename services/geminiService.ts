
import { chatHandler } from './chatHandler';

export class GeminiService {
  async generateTradingResponse(
    prompt: string,
    base64Image?: string,
    marketDataContext?: any, // Deprecated in favor of priceStore
    history: { role: string; content: string }[] = []
  ): Promise<{ text: string }> {
    try {
      const response = await chatHandler.handleMessage(prompt, base64Image);
      // Fix: chatHandler.handleMessage returns HandlerResponse, access .content
      return { text: response.content || "{}" };
    } catch (error) {
      return { 
        text: JSON.stringify({
          text: "<span style='color:#a855f7;font-weight:800;'>SYSTEM FAULT</span>\n\n<span style='color:#ffffff;'>The neural link was severed. Please refresh the terminal.</span>",
        })
      };
    }
  }
}

export const geminiService = new GeminiService();