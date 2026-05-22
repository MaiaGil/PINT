import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportarOutbound } from './exportar-outbound';

describe('ExportarOutbound', () => {
  let component: ExportarOutbound;
  let fixture: ComponentFixture<ExportarOutbound>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportarOutbound],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportarOutbound);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
