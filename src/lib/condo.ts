export const TOWERS = Array.from({ length: 10 }, (_, i) => i + 1);
export const FLOORS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** apartment number is FloorColumn (e.g. floor 8, column 8 = 808). */
export function aptNumber(floor: number, column: number) {
  return floor * 100 + column;
}

export function aptParts(apt: number) {
  return { floor: Math.floor(apt / 100), column: apt % 100 };
}

export const STATUS_LABEL: Record<string, string> = {
  working: "Funcionando",
  not_working: "Não funcionando",
  untested: "Não testado",
};
