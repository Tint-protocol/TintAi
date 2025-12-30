
import { InstitutionalMetadata } from '../../types';

export interface AuditSection {
  title: string;
  content: string;
  source_lineage?: string;
}

export interface ValidatedAudit {
  sections: AuditSection[];
  metadata: InstitutionalMetadata;
  integrityHash: string;
  tradingviewSymbol?: string;
  status: 'VERIFIED' | 'REJECTED';
  auditType: 'MARKET' | 'TRANSACTION';
  integrity_score: number;
}

export class AuditValidator {
  static validate(jsonOutput: any, matrix: any, hash: string, isTransaction: boolean = false): ValidatedAudit {
    if (!jsonOutput || !Array.isArray(jsonOutput.sections)) {
      throw new Error("ARCHITECTURAL_VIOLATION: Invalid Audit Object.");
    }

    const sections = jsonOutput.sections;
    const requiredCount = isTransaction ? 0 : 23;

    if (!isTransaction && sections.length !== requiredCount) {
      throw new Error(`VALIDATION_REJECTED: Section count mismatch (${sections.length}/${requiredCount}).`);
    }

    // High-Precision Verification: Check if AI hallucinated basic price data
    let integrityPoints = 100;
    if (!isTransaction && matrix.price) {
      const aiContent = sections.map((s: any) => s.content).join(" ");
      const rawPrice = matrix.price.toString();
      
      // Jika AI menyebutkan harga yang jauh berbeda dari matrix, kurangi skor integritas
      if (!aiContent.includes(rawPrice.substring(0, 4))) {
        integrityPoints -= 30;
      }
    }

    const validatedSections = sections.map((s: any, i: number) => {
      return {
        title: s.title.trim().toUpperCase(),
        content: s.content.trim(),
        source_lineage: this.getLineage(s.title, matrix)
      };
    });

    return {
      sections: validatedSections,
      metadata: {
        ...matrix,
        hash,
        timestamp: Date.now()
      },
      integrityHash: hash,
      tradingviewSymbol: !isTransaction ? `BINANCE:${matrix.symbol}USDT` : undefined,
      status: integrityPoints > 70 ? 'VERIFIED' : 'REJECTED',
      auditType: isTransaction ? 'TRANSACTION' : 'MARKET',
      integrity_score: integrityPoints
    };
  }

  private static getLineage(title: string, matrix: any): string {
    const t = title.toLowerCase();
    if (t.includes('price') || t.includes('volume')) return matrix.sources?.price || 'BINANCE';
    if (t.includes('funding') || t.includes('interest') || t.includes('liquid')) return matrix.sources?.derivatives || 'BYBIT/OKX';
    if (t.includes('orderbook') || t.includes('liquidity')) return matrix.sources?.liquidity || 'OKX';
    return 'TINT_CORE_INTELLIGENCE';
  }
}
