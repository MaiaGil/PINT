import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Entidade } from './entidade';

describe('Entidade', () => {
  let component: Entidade;
  let fixture: ComponentFixture<Entidade>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Entidade],
    }).compileComponents();

    fixture = TestBed.createComponent(Entidade);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
