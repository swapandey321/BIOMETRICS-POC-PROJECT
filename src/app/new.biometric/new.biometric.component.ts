import { Component } from '@angular/core';
import { FidoService } from '../fido.service';

@Component({
  selector: 'app-new.biometric',
  imports: [],
  templateUrl: './new.biometric.component.html',
  styleUrl: './new.biometric.component.scss'
})
export class NewBiometricComponent {
  constructor(private fidoService: FidoService) {}

  register() {
    this.fidoService.registerWithBiometrics().catch(err => {
      console.error('Registration failed', err);
    });
  }

  authenticate() {
    this.fidoService.authenticateWithBiometrics().catch(err => {
      console.error('Authentication failed', err);
    });
  }
}
