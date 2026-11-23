// Port of the Bronzed iOS app's burn-time estimate.
// Source: nathancamm/tan, Shared/BronzedCalculator.swift (safeTanningTime),
// Shared/SkinType.swift (baseMED) and the dashboard tile formatter in
// Bronzed/Features/Dashboard/DashboardView.swift (formattedSafeTime).
// Keep the constants and the order of operations identical to the app so both
// produce the same floating point result, and therefore the same whole minutes.

export type SkinType = 1 | 2 | 3 | 4 | 5 | 6;

export const skinTypes: ReadonlyArray<{ value: SkinType; numeral: string; skin: string; burns: string }> = [
  { value: 1, numeral: 'I', skin: 'Very fair skin, often freckled', burns: 'Always burns, never tans' },
  { value: 2, numeral: 'II', skin: 'Fair skin', burns: 'Usually burns, tans minimally' },
  { value: 3, numeral: 'III', skin: 'Medium skin', burns: 'Sometimes burns, tans gradually' },
  { value: 4, numeral: 'IV', skin: 'Olive skin', burns: 'Rarely burns, tans easily' },
  { value: 5, numeral: 'V', skin: 'Brown skin', burns: 'Very rarely burns, tans darkly' },
  { value: 6, numeral: 'VI', skin: 'Dark brown or black skin', burns: 'Least likely to burn' },
];

/** The app's assumed minutes to first redness at UV index 6, by Fitzpatrick type. */
export const baseMedMinutes: Readonly<Record<SkinType, number>> = {
  1: 10,
  2: 15,
  3: 25,
  4: 35,
  5: 50,
  6: 60,
};

/** The SPF choices the app offers. 0 means no sunscreen. */
export const spfOptions = [0, 15, 30, 50] as const;

/** The UV index range the web calculator accepts. */
export const uvRange = { min: 0, max: 16 } as const;

/** Rows of the reference tables. */
export const uvLevels = Array.from({ length: 14 }, (_, index) => index + 1);

export interface BurnTimeInput {
  skinType: SkinType;
  uvIndex: number;
  /** Sunscreen SPF. 0 or 1 means none. */
  spf: number;
  /** Fraction of the sky covered by cloud, 0 to 1. */
  cloudCover: number;
}

/** Estimated minutes before burn risk, exactly as BronzedCalculator.safeTanningTime. */
export function burnTimeMinutes({ skinType, uvIndex, spf, cloudCover }: BurnTimeInput): number {
  // Swift: guard uvIndex > 0 else { return 0 }. NaN also fails this test.
  if (!(uvIndex > 0)) return 0;

  const spfFactor = Math.max(spf, 1);
  const baseMins = (baseMedMinutes[skinType] * spfFactor) / (uvIndex / 6.0);

  // Clouds block up to ~25% of UV.
  const cloudAdjustment = 1.0 / (1.0 - cloudCover * 0.25);
  const adjusted = baseMins * cloudAdjustment;

  // 80% safety margin.
  return adjusted * 0.8;
}

/**
 * The app's dashboard wording: whole minutes below two hours, whole hours up
 * to eight, then "8+ hr". Both units truncate, as Swift's Int() does. A zero
 * estimate (UV 0) shows an em dash.
 */
export function formatBurnTime(minutes: number): string {
  if (!(minutes > 0)) return '—';
  const mins = Math.trunc(minutes);
  if (mins >= 120) {
    const hours = Math.trunc(mins / 60);
    return hours >= 8 ? '8+ hr' : `${hours} hr`;
  }
  return `${mins} min`;
}

export function skinTypeLabel(skinType: SkinType): string {
  return `Type ${skinTypes[skinType - 1].numeral}`;
}

export function spfLabel(spf: number): string {
  return spf > 1 ? `SPF ${spf}` : 'No sunscreen';
}

/** One line naming the inputs, such as "Type II · UV 8 · No sunscreen · 0% cloud". */
export function describeConditions({ skinType, uvIndex, spf, cloudCover }: BurnTimeInput, includeUv = true): string {
  const uv = Number.isInteger(uvIndex) ? uvIndex.toString() : uvIndex.toFixed(1);
  const parts = [skinTypeLabel(skinType), `UV ${uv}`, spfLabel(spf), `${Math.round(cloudCover * 100)}% cloud`];
  return (includeUv ? parts : parts.filter((_, index) => index !== 1)).join(' · ');
}

/** Caption for the table of estimates across UV levels. */
export function describeUvTable(input: BurnTimeInput): string {
  return `By UV index: ${describeConditions(input, false)}`;
}
