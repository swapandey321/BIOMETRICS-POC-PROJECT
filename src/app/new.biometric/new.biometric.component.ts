import { Component } from '@angular/core';
import { FidoService } from '../fido.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-new.biometric',
  imports: [MatButtonModule],
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
