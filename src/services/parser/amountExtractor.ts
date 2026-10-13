import { ExtractedAmount } from './types';

/**
 * Extracts numeric money amounts from Indian UPI / banking notifications.
 * Handles formats:
 * - ₹1, ₹25.50, ₹1,000, ₹10,000, ₹1,00,000.75
 * - Rs. 500, Rs.1000, INR 250.00
 * - Explicitly avoids mistaking UTR numbers, account digits, or phone numbers for amounts.
 */
export function extractAmount(text: string): ExtractedAmount | null {
  if (!text) return null;

  // Normalize rupee symbols and whitespace
  const normalized = text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width characters
    .replace(/(\u20B9|Rs\.?|INR)/gi, '₹');  // standardize currency symbol to ₹

  // Regex 1: Match ₹ followed by either comma-formatted numbers or plain integers/decimals
  // e.g. ₹1, ₹25.50, ₹1,000, ₹10,000, ₹1,00,000.00
  const rupeePattern = /₹\s*([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
  const match = normalized.match(rupeePattern);

  if (match && match[1]) {
    const rawNumberStr = match[1];
    // Remove commas to parse clean float
    const cleanNumber = rawNumberStr.replace(/,/g, '');
    const parsedValue = parseFloat(cleanNumber);

    if (!isNaN(parsedValue) && parsedValue > 0) {
      return {
        value: parsedValue,
        currency: 'INR',
        rawString: `₹${rawNumberStr}`
      };
    }
  }

  // Regex 2: Pattern where number precedes "rupees" / "rs"
  // e.g. "250 rupees received" or "1000.50 rs received"
  const suffixPattern = /\b([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:rupees|rs\.?|inr)\b/i;
  const suffixMatch = text.match(suffixPattern);

  if (suffixMatch && suffixMatch[1]) {
    const rawNumberStr = suffixMatch[1];
    const cleanNumber = rawNumberStr.replace(/,/g, '');
    const parsedValue = parseFloat(cleanNumber);

    if (!isNaN(parsedValue) && parsedValue > 0) {
      return {
        value: parsedValue,
        currency: 'INR',
        rawString: `₹${rawNumberStr}`
      };
    }
  }

  return null;
}

/**
 * Extracts UTR or Bank Reference ID from notification text.
 * Common formats: UTR: 328910482910, Ref no 382910492810, UPI Ref: 482910...
 */
export function extractReferenceId(text: string): string | undefined {
  if (!text) return undefined;

  const patterns = [
    /(?:UTR|Ref(?:erence)?(?:\s*no|\s*id)?|UPI\s*Ref)[:\s#]*([A-Za-z0-9]{8,22})/i,
    /(?:Txn\s*ID|Transaction\s*ID)[:\s#]*([A-Za-z0-9]{8,22})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Extracts payer name if present in notification text
 * e.g. "Received ₹500 from Ramesh Kumar" -> Ramesh Kumar
 * "from Amit Singh (amit@oksbi)" -> Amit Singh
 */
export function extractPayerName(text: string): string | undefined {
  if (!text) return undefined;

  const patterns = [
    /(?:received|credited)\s+.*?from\s+([A-Za-z0-9\s.]+?)(?:\s*(?:\(UTR|\(via|\(UPI|\(Bank|\.|\/|$))/i,
    /from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Filter out common false positives
      const lower = candidate.toLowerCase();
      if (!lower.includes('bank') && !lower.includes('account') && !lower.includes('upi') && candidate.length > 1 && candidate.length < 40) {
        return candidate;
      }
    }
  }

  return undefined;
}
