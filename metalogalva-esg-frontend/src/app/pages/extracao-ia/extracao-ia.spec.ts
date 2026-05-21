import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtracaoIa } from './extracao-ia';

describe('ExtracaoIa', () => {
  let component: ExtracaoIa;
  let fixture: ComponentFixture<ExtracaoIa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtracaoIa],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtracaoIa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
