import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IaExtracao } from './ia-extracao';

describe('IaExtracao', () => {
  let component: IaExtracao;
  let fixture: ComponentFixture<IaExtracao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IaExtracao],
    }).compileComponents();

    fixture = TestBed.createComponent(IaExtracao);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
