/**
 * Formats numeric amount into natural spoken currency strings.
 * e.g.:
 * 25 -> "25 rupees"
 * 1 -> "1 rupee"
 * 125.50 -> "125 rupees and 50 paise"
 * 1000 -> "1 thousand rupees"
 */
export function formatAmountForSpeech(amount: number, language: string): string {
  const rounded = Math.round(amount * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  if (language === 'hi-IN') {
    if (paise > 0) {
      return `${rupees} रुपये ${paise} पैसे`;
    }
    return `${rupees} रुपये`;
  }

  if (language === 'te-IN') {
    if (paise > 0) {
      return `${rupees} రూపాయల ${paise} పైసలు`;
    }
    return `${rupees} రూపాయలు`;
  }

  if (language === 'ta-IN') {
    if (paise > 0) {
      return `${rupees} ரூபாய் ${paise} பைசா`;
    }
    return `${rupees} ரூபாய்`;
  }

  if (language === 'kn-IN') {
    if (paise > 0) {
      return `${rupees} ರೂಪಾಯಿ ${paise} ಪೈಸೆ`;
    }
    return `${rupees} ರೂಪಾಯಿ`;
  }

  if (language === 'mr-IN') {
    if (paise > 0) {
      return `${rupees} रुपये ${paise} पैसे`;
    }
    return `${rupees} रुपये`;
  }

  // Default English (en-IN)
  const rupeeWord = rupees === 1 ? 'rupee' : 'rupees';
  if (paise > 0) {
    return `${rupees} ${rupeeWord} and ${paise} paise`;
  }
  return `${rupees.toLocaleString('en-IN')} ${rupeeWord}`;
}
