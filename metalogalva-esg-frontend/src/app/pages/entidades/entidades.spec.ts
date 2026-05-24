import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Entidades } from './entidades';

describe('Entidades', () => {
  let component: Entidades;
  let fixture: ComponentFixture<Entidades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Entidades],
    }).compileComponents();

    fixture = TestBed.createComponent(Entidades);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
