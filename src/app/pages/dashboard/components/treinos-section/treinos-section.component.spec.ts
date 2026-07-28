import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreinosSectionComponent } from './treinos-section.component';

describe('TreinosSectionComponent', () => {
  let component: TreinosSectionComponent;
  let fixture: ComponentFixture<TreinosSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinosSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreinosSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
