import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestaoKpis } from './gestao-kpis';

describe('GestaoKpis', () => {
  let component: GestaoKpis;
  let fixture: ComponentFixture<GestaoKpis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestaoKpis],
    }).compileComponents();

    fixture = TestBed.createComponent(GestaoKpis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
