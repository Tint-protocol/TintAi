
export type InteractionMode = "MARKET_STRICT" | "PERSONAL_COMPANION";
export type PersonaType = "INSTITUTIONAL_SAAS" | "PERSONAL_HUMANOID";

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
  mode: InteractionMode;
  persona: PersonaType;
  integrityHash?: string;
}

/**
 * Added missing AnalysisHistoryItem interface to support analysis history tracking in App and Sidebar.
 */
export interface AnalysisHistoryItem {
  id: string;
  label: string;
  query: string;
  timestamp: Date;
}

export interface MarketMatrix {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  openInterest?: number;
  oiChange24h?: number;
  fundingRate?: number;
  longShortRatio?: number;
  liquidations1h?: { longs: number; shorts: number };
  bidDepth?: number;
  askDepth?: number;
  aggressionIndex?: number; // Momentum from Bitget
  lastUpdated: number;
  sources: {
    price: string;
    derivatives: string;
    liquidity: string;
  };
  availability: {
    spot: boolean;
    derivatives: boolean;
    orderflow: boolean;
  };
}

export interface InstitutionalMetadata extends MarketMatrix {
  asset_name: string;
  logo_url: string;
  contract_address?: string;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number;
  holders_count?: string;
  market_cap?: number;
  fdv?: number;
  hash: string;
  /**
   * Added missing properties to InstitutionalMetadata to align with ChatArea.tsx and blockchainService data fetching.
   */
  market_cap_change?: number;
  spot_volume_24h?: number;
  volume_change_24h?: number;
  vol_mkt_cap_ratio?: number | string;
  timestamp: number | string | Date;
}
