import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestaoMetricas } from './gestao-metricas';

describe('GestaoMetricas', () => {
  let component: GestaoMetricas;
  let fixture: ComponentFixture<GestaoMetricas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestaoMetricas],
    }).compileComponents();

    fixture = TestBed.createComponent(GestaoMetricas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
