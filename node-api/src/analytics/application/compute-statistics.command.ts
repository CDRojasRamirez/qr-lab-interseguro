/** Input of the compute-statistics use case (transport-agnostic). */
export interface ComputeStatisticsCommand {
  readonly matrices: ReadonlyArray<{
    readonly name: string;
    readonly values: ReadonlyArray<ReadonlyArray<number>>;
  }>;
}
