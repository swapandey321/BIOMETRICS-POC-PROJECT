import { Routes } from '@angular/router';
import { BiomComponent } from './biom/biom.component';

export const routes: Routes = [
    { path: '', component: BiomComponent, pathMatch: 'full' }
  ];
