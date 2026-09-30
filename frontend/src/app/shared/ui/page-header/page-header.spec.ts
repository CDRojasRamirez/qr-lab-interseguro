import { TestBed } from '@angular/core/testing';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('renders the title and optional subtitle', async () => {
    const fixture = TestBed.createComponent(PageHeader);
    fixture.componentRef.setInput('title', 'Factorización QR');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toBe('Factorización QR');
    expect(el.querySelector('.subtitle')).toBeNull();

    fixture.componentRef.setInput('subtitle', 'A = Q·R');
    await fixture.whenStable();
    expect(el.querySelector('.subtitle')?.textContent).toBe('A = Q·R');
  });
});
