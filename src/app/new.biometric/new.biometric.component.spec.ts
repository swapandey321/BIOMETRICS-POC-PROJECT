import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewBiometricComponent } from './new.biometric.component';

describe('NewBiometricComponent', () => {
  let component: NewBiometricComponent;
  let fixture: ComponentFixture<NewBiometricComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewBiometricComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewBiometricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
