import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatrixInput } from './matrix-input';

describe('MatrixInput', () => {
  let fixture: ComponentFixture<MatrixInput>;
  let el: HTMLElement;
  let emitted: number[][][];

  const cells = () => [...el.querySelectorAll<HTMLInputElement>('input.cell')];
  const values = () => cells().map((c) => c.value);
  const select = (id: string) => el.querySelector<HTMLSelectElement>(`#${id}`)!;
  const button = (text: string) =>
    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!;
  const flush = () => fixture.whenStable();

  const choose = async (id: string, value: number) => {
    select(id).value = String(value);
    select(id).dispatchEvent(new Event('change'));
    await flush();
  };
  const typeInto = async (index: number, value: string) => {
    cells()[index].value = value;
    cells()[index].dispatchEvent(new Event('input'));
    await flush();
  };

  beforeEach(async () => {
    emitted = [];
    await TestBed.configureTestingModule({ imports: [MatrixInput] }).compileComponents();
    fixture = TestBed.createComponent(MatrixInput);
    fixture.componentInstance.matrixSubmit.subscribe((m) => emitted.push(m));
    el = fixture.nativeElement;
    await flush();
  });

  it('starts with the 3x3 example', () => {
    expect(cells()).toHaveLength(9);
    expect(values().slice(0, 3)).toEqual(['12', '-51', '4']);
  });

  it('resizes keeping existing values and zero-filling new cells', async () => {
    await choose('rows', 2);
    expect(cells()).toHaveLength(6);
    await choose('cols', 4);
    expect(cells()).toHaveLength(8);
    expect(values()).toEqual(['12', '-51', '4', '0', '6', '167', '-68', '0']);
    await choose('rows', 3);
    expect(values().slice(8)).toEqual(['0', '0', '0', '0']);
  });

  it('offers sizes from 1 to 10', () => {
    const options = [...select('rows').options].map((o) => Number(o.value));
    expect(options[0]).toBe(1);
    expect(options[options.length - 1]).toBe(10);
  });

  it('"Limpiar" zeroes everything keeping the size', async () => {
    button('Limpiar').click();
    await flush();
    expect(values()).toEqual(Array(9).fill('0'));
  });

  it('"Ejemplo" restores the example after resizing', async () => {
    await choose('rows', 1);
    button('Ejemplo').click();
    await flush();
    expect(cells()).toHaveLength(9);
    expect(values()[4]).toBe('167');
  });

  it('"Aleatoria" fills finite numbers in the current size', async () => {
    await choose('cols', 2);
    button('Aleatoria').click();
    await flush();
    expect(cells()).toHaveLength(6);
    expect(values().every((v) => v !== '' && Number.isFinite(Number(v)))).toBe(true);
  });

  it('emits the numeric matrix on submit', async () => {
    await choose('rows', 1);
    await choose('cols', 2);
    await typeInto(1, '2.5');
    button('Calcular QR').click();
    await flush();
    expect(emitted).toEqual([[[12, 2.5]]]);
  });

  it('blocks submit and flags non-finite cells', async () => {
    await typeInto(0, '');
    expect(button('Calcular QR').disabled).toBe(true);
    expect(cells()[0].getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('.field-error')?.textContent).toContain('números finitos');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    expect(emitted).toHaveLength(0);

    await typeInto(0, '1e999');
    expect(button('Calcular QR').disabled).toBe(true);
  });

  it('disables every control while disabled and shows progress', async () => {
    fixture.componentRef.setInput('disabled', true);
    await flush();
    expect(el.querySelector('button[type=submit]')?.textContent).toContain('Calculando');
    const controls = [...el.querySelectorAll<HTMLInputElement>('input, select, button')];
    expect(controls.every((c) => c.disabled)).toBe(true);
  });
});
