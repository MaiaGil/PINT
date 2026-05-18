import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmissaoCarbono } from './emissao-carbono';

describe('EmissaoCarbono', () => {
  let component: EmissaoCarbono;
  let fixture: ComponentFixture<EmissaoCarbono>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmissaoCarbono],
    }).compileComponents();

    fixture = TestBed.createComponent(EmissaoCarbono);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
