import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Transporte } from './transporte';

describe('Transporte', () => {
  let component: Transporte;
  let fixture: ComponentFixture<Transporte>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transporte],
    }).compileComponents();

    fixture = TestBed.createComponent(Transporte);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
