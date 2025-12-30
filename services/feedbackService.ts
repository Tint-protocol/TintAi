
/**
 * ============================================================
 * ALADIN AI — FEEDBACK TELEMETRY SERVICE
 * Professional / Privacy-Safe / Deploy-Ready
 * ============================================================
 *
 * TABLE: message_feedback (append-only)
 * UNIQUE(message_id, session_id)
 */

export type FeedbackType = 'like' | 'dislike';

type FeedbackPayload = {
  message_id: string;
  session_id: string;
  feedback_type: FeedbackType;
  model: string;
  ui_version: string;
  created_at: string;
};

export class FeedbackService {
  private readonly sessionId: string;
  private readonly sentFeedback: Set<string> = new Set();

  private readonly MODEL_ID = 'aladin-ai-v1';
  private readonly UI_VERSION = 'web-2025.01';

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  /* ---------- SESSION MANAGEMENT ---------- */

  private getOrCreateSessionId(): string {
    let id = localStorage.getItem('aladin_session_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('aladin_session_id', id);
    }
    return id;
  }

  /* ---------- FEEDBACK SUBMISSION ---------- */

  async submitFeedback(
    messageId: string,
    type: FeedbackType | null
  ): Promise<boolean> {
    if (!type) return true;

    // Client-side deduplication
    if (this.sentFeedback.has(messageId)) return true;
    this.sentFeedback.add(messageId);

    const payload: FeedbackPayload = {
      message_id: messageId,
      session_id: this.sessionId,
      feedback_type: type,
      model: this.MODEL_ID,
      ui_version: this.UI_VERSION,
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return res.ok;
    } catch {
      // Telemetry must never break UX
      console.debug('[Aladin AI] Feedback sync failed (non-blocking).');
      return true;
    }
  }

  /* ---------- SHARE / COPY ---------- */

  async shareContent(text: string): Promise<void> {
    try {
      const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
      await navigator.clipboard.writeText(cleanText);
    } catch (err) {
      console.warn('[Aladin AI] Clipboard share failed.', err);
    }
  }
}

export const feedbackService = new FeedbackService();
