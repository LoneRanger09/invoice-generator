/**
 * Utility functions for money calculations and currency formatting.
 * All financial math is computed in integer paise to avoid floating-point inaccuracies.
 */

export function toPaise(rupees: number): number {
  if (isNaN(rupees) || !isFinite(rupees)) return 0;
  return Math.round((rupees + Number.EPSILON) * 100);
}

export function fromPaise(paise: number): number {
  if (isNaN(paise) || !isFinite(paise)) return 0;
  return Math.round(paise) / 100;
}

export function calculateLineAmountPaise(qty: number, rateRupees: number): number {
  if (qty <= 0 || rateRupees <= 0 || isNaN(qty) || isNaN(rateRupees)) return 0;
  const ratePaise = toPaise(rateRupees);
  // qty can have decimals (e.g. 17.60)
  return Math.round(qty * ratePaise);
}

export function calculateRoundOffPaise(subtotalPaise: number, enabled: boolean): {
  roundOffPaise: number;
  totalPaise: number;
} {
  if (!enabled) {
    return {
      roundOffPaise: 0,
      totalPaise: subtotalPaise
    };
  }

  // Nearest rupee: total rounded to nearest 100 paise
  const roundedTotalPaise = Math.round(subtotalPaise / 100) * 100;
  const roundOffPaise = roundedTotalPaise - subtotalPaise;

  return {
    roundOffPaise,
    totalPaise: roundedTotalPaise
  };
}

/**
 * Formats a given rupee amount into Indian currency format (e.g. ₹1,23,456.00 or ₹10,166.00).
 */
export function formatINR(rupees: number): string {
  const safeVal = isNaN(rupees) || !isFinite(rupees) ? 0 : rupees;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(safeVal);
  return `₹${formatted}`;
}

/**
 * Formats rate or unit amount with 2 decimal places in Indian format (without ₹ symbol).
 */
export function formatNumberIN(val: number): string {
  const safeVal = isNaN(val) || !isFinite(val) ? 0 : val;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(safeVal);
}
