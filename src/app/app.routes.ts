import { Routes } from '@angular/router';
import { NewBiometricComponent } from './new.biometric/new.biometric.component';
import { BiomComponent } from './biom/biom.component';

export const routes: Routes = [
    { path: '', component: NewBiometricComponent, pathMatch: 'full' }
  ];
