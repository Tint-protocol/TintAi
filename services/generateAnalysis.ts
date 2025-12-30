
import { usePriceStore } from '../store/priceStore';
import { llm } from './llm';
import { blockchainService } from './blockchainService';
import { HashService } from './hashService';
import { AuditValidator } from './audit/validator';
import { Type } from "@google/genai";

export const generateAnalysis = async (
  userPrompt: string,
  imageBase64?: string,
  history: any[] = [],
  coinId?: string
) => {
  const store = usePriceStore.getState();
  const activeSymbol = store.activeSymbol;
  const baseSymbol = activeSymbol.replace('USDT', '').toUpperCase();

  const isHash = blockchainService.isTransactionHash(userPrompt);
  const isAddr = blockchainService.isAddress(userPrompt);
  
  let blockchainData = null;
  let mode: 'MARKET' | 'TRANSACTION' | 'CONTRACT' = 'MARKET';

  if (isHash) {
    blockchainData = await blockchainService.getTransactionDetails(userPrompt.trim());
    mode = 'TRANSACTION';
  } else if (isAddr) {
    blockchainData = await blockchainService.getTokenInfo(userPrompt.trim());
    mode = 'CONTRACT';
  }

  let snapshotData = await blockchainService.getMarketDataBySymbol(baseSymbol, coinId);
  const matrix = store.getMatrix(activeSymbol);
  
  const contextData = {
    ...snapshotData,
    ...matrix,
    blockchainData
  };

  const snapshotString = JSON.stringify(contextData);
  const integrityHash = await HashService.generateSHA256(snapshotString + userPrompt);

  const systemInstruction = `
    ROLE: Tint AI Sovereign Engine (HARD_FORK_v1).
    MODE: DETERMINISTIC_QUANT_AUDIT.
    
    DATA_GROUNDING: 
    - REAL_TIME_MATRIX: ${snapshotString}
    
    STRICT_INTEGRITY_LAWS:
    1. ZERO_HALLUCINATION: If a metric is not in the REAL_TIME_MATRIX, respond "METRIC_OFFLINE".
    2. NUMERICAL_ANCHORING: All price mentions must match the matrix price (${contextData.price}).
    3. NO_SPECULATION: Only analyze based on Orderflow, OI, Funding, and Liquidity.
    
    AUDIT_STRUCTURE (MARKET_MODE):
    Generate EXACTLY 23 sections. Each section must cover:
    1. Market Structure, 2. Orderbook Imbalance, 3. Volume Profile, 4. Delta Analysis, 5. OI Momentum, 
    6. Funding Divergence, 7. Liquidation Heat, 8. Absorption Zones, 9. Volatility Clusters, 10. RSI Grounding,
    11. Institutional Flow, 12. Retail Aggression, 13. Mean Reversion Risk, 14. Trend Exhaustion, 15. Whale Moves,
    16. Exchange Net Flow, 17. Bid/Ask Walls, 18. Slippage Estimates, 19. Basis Analysis, 20. Correlation Matrix,
    21. Macro Alignment, 22. Risk Exposure, 23. Sovereign Conclusion.

    If an image is provided, perform Visual OCR and cross-reference with Matrix Data.
  `;

  const auditSchema = {
    type: Type.OBJECT,
    properties: {
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING }
          },
          required: ["title", "content"]
        }
      }
    },
    required: ["sections"]
  };

  const imageParts = imageBase64 ? [{
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64.split(',')[1] || imageBase64
    }
  }] : undefined;

  // Use gemini-3-pro-preview for Hard Fork stability and complex reasoning
  const jsonResult = await llm.call({
    prompt: `EXECUTE_SOVEREIGN_AUDIT: ${userPrompt}`,
    systemInstruction,
    history,
    imageParts,
    temperature: 0.0, // Force Determinism
    responseSchema: auditSchema
  });

  const validatedAudit = AuditValidator.validate(jsonResult, contextData, integrityHash, mode === 'TRANSACTION');
  return JSON.stringify(validatedAudit);
};
