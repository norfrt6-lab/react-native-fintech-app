/**
 * Decimal precision utilities for financial calculations.
 * Uses integer arithmetic internally to avoid floating-point errors.
 */

const DEFAULT_PRECISION = 8;

/**
 * Round a number to the specified decimal places using banker's rounding.
 */
export function toFixed(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Multiply two numbers with precision-safe rounding.
 */
export function multiply(a: number, b: number, precision = DEFAULT_PRECISION): number {
  return toFixed(a * b, precision);
}

/**
 * Divide two numbers with precision-safe rounding.
 * Returns 0 if divisor is 0.
 */
export function divide(a: number, b: number, precision = DEFAULT_PRECISION): number {
  if (b === 0) return 0;
  return toFixed(a / b, precision);
}

/**
 * Subtract with precision.
 */
export function subtract(a: number, b: number, precision = DEFAULT_PRECISION): number {
  return toFixed(a - b, precision);
}

/**
 * Add with precision.
 */
export function add(a: number, b: number, precision = DEFAULT_PRECISION): number {
  return toFixed(a + b, precision);
}

/**
 * Calculate percentage of a value.
 * E.g., percentOf(100, 0.1) = 0.1 (0.1% of 100)
 */
export function percentOf(value: number, percentage: number): number {
  return toFixed(value * (percentage / 100), DEFAULT_PRECISION);
}
