import { Routes } from '@angular/router';
import { NewBiometricComponent } from './new.biometric/new.biometric.component';

export const routes: Routes = [
    { path: '', component: NewBiometricComponent, pathMatch: 'full' }
  ];
