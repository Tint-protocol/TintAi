
import { llm } from './llm';
import { Type } from "@google/genai";

const COMPANION_DIRECTIVES = `
GLOBAL SYSTEM DIRECTIVE
You are Tint AI by TintDAO.
Respond as a Knowledgeable, calm, supportive assistant.

LANGUAGE POLICY: Default ENGLISH. Use user's language only if they initiate.

STRICT FORMATTING RULE — TITLES:
For EVERY major section use:
<div style="margin-top:32px; margin-bottom:12px; display:flex; align-items:center; gap:10px;">
  <span style="color:#a855f7; font-size:22px; line-height:1;">•</span>
  <span style="color:#a855f7; font-weight:900; font-family:'Arial Black', Gadget, sans-serif; text-transform:uppercase; letter-spacing:-0.01em; font-size:14px;">TITLE_NAME</span>
</div>

STRICT FORMATTING RULE — PARAGRAPHS:
Use <p style="margin-bottom: 16px; color: #d1d5db; line-height: 1.6;">.
DO NOT use markdown headers (#).
`;

export const generatePersonal = async (userPrompt: string, history: any[] = []) => {
  const companionSchema = {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING },
      suggestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: ["text"]
  };

  const systemInstruction = `
    ${COMPANION_DIRECTIVES}
    TASK: Provide conversational intelligence based on history.
  `;

  const result = await llm.call({
    prompt: userPrompt,
    systemInstruction,
    history,
    temperature: 0.8,
    responseSchema: companionSchema
  });

  // Ensure we return a STRING to prevent React Error #31
  return JSON.stringify(result);
};
