import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Periodo } from './periodo';

describe('Periodo', () => {
  let component: Periodo;
  let fixture: ComponentFixture<Periodo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Periodo],
    }).compileComponents();

    fixture = TestBed.createComponent(Periodo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
