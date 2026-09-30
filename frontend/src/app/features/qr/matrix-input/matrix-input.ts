import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../shared/ui/icons';

const MAX_SIZE = 10;
const EXAMPLE = [
  [12, -51, 4],
  [6, 167, -68],
  [-4, 24, -41],
];

const toCells = (m: number[][]) => m.map((row) => row.map(String));

/** Cells are kept as text so an empty or malformed entry can be flagged, not coerced. */
const parseCell = (text: string): number | null => {
  if (text.trim() === '') return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
};

@Component({
  selector: 'app-matrix-input',
  imports: [LucideAngularModule],
  templateUrl: './matrix-input.html',
  styleUrl: './matrix-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatrixInput {
  readonly disabled = input(false);
  readonly matrixSubmit = output<number[][]>();

  protected readonly icons = ICONS;
  protected readonly sizes = Array.from({ length: MAX_SIZE }, (_, i) => i + 1);
  protected readonly cells = signal<string[][]>(toCells(EXAMPLE));
  protected readonly rows = computed(() => this.cells().length);
  protected readonly cols = computed(() => this.cells()[0].length);
  protected readonly parsed = computed(() => this.cells().map((row) => row.map(parseCell)));
  protected readonly valid = computed(() => this.parsed().every((row) => !row.includes(null)));

  protected setRows(event: Event): void {
    this.resize(this.readNumber(event), this.cols());
  }

  protected setCols(event: Event): void {
    this.resize(this.rows(), this.readNumber(event));
  }

  protected setCell(i: number, j: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.cells.update((grid) =>
      grid.map((row, r) => (r === i ? row.map((cell, c) => (c === j ? value : cell)) : row)),
    );
  }

  protected loadExample(): void {
    this.cells.set(toCells(EXAMPLE));
  }

  protected randomize(): void {
    this.fill(() => String(Math.floor(Math.random() * 19) - 9));
  }

  protected clear(): void {
    this.fill(() => '0');
  }

  protected submit(): void {
    if (!this.valid() || this.disabled()) return;
    this.matrixSubmit.emit(this.parsed() as number[][]);
  }

  private fill(value: () => string): void {
    this.cells.update((grid) => grid.map((row) => row.map(value)));
  }

  private resize(rows: number, cols: number): void {
    const old = this.cells();
    this.cells.set(
      Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => old[i]?.[j] ?? '0')),
    );
  }

  private readNumber(event: Event): number {
    return Number((event.target as HTMLSelectElement).value);
  }
}
