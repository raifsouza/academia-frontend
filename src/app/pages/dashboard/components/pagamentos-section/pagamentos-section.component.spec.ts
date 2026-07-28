import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagamentosSectionComponent } from './pagamentos-section.component';

describe('PagamentosSectionComponent', () => {
  let component: PagamentosSectionComponent;
  let fixture: ComponentFixture<PagamentosSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagamentosSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagamentosSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
