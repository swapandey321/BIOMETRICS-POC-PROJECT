import { Component } from '@angular/core';
import { FidoService } from '../fido.service';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-new.biometric',
  imports: [MatButtonModule,FormsModule],
  templateUrl: './new.biometric.component.html',
  styleUrl: './new.biometric.component.scss'
})
export class NewBiometricComponent {
  constructor(private fidoService: FidoService) {}

  email: string = '';

  register(email: string) {
    this.fidoService.registerWithBiometrics(email).catch(err => {
      console.error('Registration failed', err);
    });
  }

  authenticate(email: string) {
    this.fidoService.authenticateWithBiometrics(email).catch(err => {
      console.error('Authentication failed', err);
    });
  }
}
