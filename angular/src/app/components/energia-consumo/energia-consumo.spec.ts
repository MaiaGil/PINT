import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnergiaConsumo } from './energia-consumo';

describe('EnergiaConsumo', () => {
  let component: EnergiaConsumo;
  let fixture: ComponentFixture<EnergiaConsumo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnergiaConsumo],
    }).compileComponents();

    fixture = TestBed.createComponent(EnergiaConsumo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
