/** DTOs mirroring docs/api-contract.md exactly. */
export type Matrix = number[][];

export interface FactorizationRequest {
  matrix: Matrix;
}

export interface GlobalStats {
  max: number;
  min: number;
  average: number;
  sum: number;
  count: number;
}

export interface MatrixStats extends GlobalStats {
  name: string;
  isDiagonal: boolean;
}

export interface Statistics {
  global: GlobalStats;
  perMatrix: MatrixStats[];
  anyDiagonal: boolean;
}

export interface FactorizationResponse {
  q: Matrix;
  r: Matrix;
  statistics: Statistics;
}
