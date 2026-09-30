import type { AnalysisResult } from '../../domain/index.js';

export interface StatisticsResponseDto {
  global: StatsDto;
  perMatrix: Array<StatsDto & { name: string; isDiagonal: boolean }>;
  anyDiagonal: boolean;
}

interface StatsDto {
  max: number;
  min: number;
  average: number;
  sum: number;
  count: number;
}

/** Maps a domain AnalysisResult to the public response DTO. */
export function toStatisticsResponse(result: AnalysisResult): StatisticsResponseDto {
  return {
    global: result.global.toJSON(),
    perMatrix: result.perMatrix.map((m) => ({
      name: m.name,
      ...m.statistics.toJSON(),
      isDiagonal: m.isDiagonal,
    })),
    anyDiagonal: result.anyDiagonal,
  };
}
