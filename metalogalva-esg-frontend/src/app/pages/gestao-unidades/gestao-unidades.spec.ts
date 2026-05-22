import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestaoUnidades } from './gestao-unidades';

describe('GestaoUnidades', () => {
  let component: GestaoUnidades;
  let fixture: ComponentFixture<GestaoUnidades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestaoUnidades],
    }).compileComponents();

    fixture = TestBed.createComponent(GestaoUnidades);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
