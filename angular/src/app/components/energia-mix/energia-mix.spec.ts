import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnergiaMix } from './energia-mix';

describe('EnergiaMix', () => {
  let component: EnergiaMix;
  let fixture: ComponentFixture<EnergiaMix>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnergiaMix],
    }).compileComponents();

    fixture = TestBed.createComponent(EnergiaMix);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
