import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestaoDados } from './gestao-dados';

describe('GestaoDados', () => {
  let component: GestaoDados;
  let fixture: ComponentFixture<GestaoDados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestaoDados],
    }).compileComponents();

    fixture = TestBed.createComponent(GestaoDados);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
