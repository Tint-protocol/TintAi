
export class WSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessage: (data: any) => void;
  private onClose?: () => void;
  private onError?: (err: any) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    url: string, 
    onMessage: (data: any) => void,
    onClose?: () => void,
    onError?: (err: any) => void
  ) {
    this.url = url;
    this.onMessage = onMessage;
    this.onClose = onClose;
    this.onError = onError;
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (e) {
          console.warn("WS Message Parse Error:", e);
        }
      };
      this.ws.onclose = () => {
        this.handleReconnect();
        if (this.onClose) this.onClose();
      };
      this.ws.onerror = (err) => {
        // Log more descriptive error instead of [object Object]
        console.error(`WebSocket connection error to ${this.url}`);
        if (this.onError) this.onError(err);
      };
    } catch (e) {
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  close() {
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect on manual close
      this.ws.onerror = null;
      this.ws.close();
    }
  }
}
