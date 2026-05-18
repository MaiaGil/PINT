import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoMaterial } from './tipo-material';

describe('TipoMaterial', () => {
  let component: TipoMaterial;
  let fixture: ComponentFixture<TipoMaterial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoMaterial],
    }).compileComponents();

    fixture = TestBed.createComponent(TipoMaterial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
