import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BiomComponent } from './biom.component';

describe('BiomComponent', () => {
  let component: BiomComponent;
  let fixture: ComponentFixture<BiomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BiomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BiomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
