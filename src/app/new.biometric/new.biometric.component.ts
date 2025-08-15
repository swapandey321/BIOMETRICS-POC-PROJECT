import { Component } from '@angular/core';
import { FidoService } from '../fido.service';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import {BiometricAuth} from '@aparajita/capacitor-biometric-auth';

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
    this.checkBiometricAvailibility()
    this.fidoService.registerWithBiometrics(email).catch(err => {
      console.error('Registration failed', err);
    });
  }

  authenticate(email: string) {
    this.fidoService.authenticateWithBiometrics(email).catch(err => {
      console.error('Authentication failed', err);
    });
  }

  async checkBiometricAvailibility(): Promise<any>{
    const isWebAuthnSupported = await FidoPluginPoc.isWebAuthnSupported();
    console.log(isWebAuthnSupported);
    const result = await BiometricAuth.checkBiometry()
    console.log('check biometry');
    console.log(result);
    
    if(result.isAvailable){
      if(result.strongCode == 'biometryNotEnrolled' || result.strongReason?.includes('does not have any biometrics')){

      return {
        "isBiometricAvailable": false,
        "biometryType": result.biometryType
      }
    }else if(result.strongCode == '' && result.strongReason == ''){
      return {
        "isBiometricAvailable": result.isAvailable,
        "biometryType": result.biometryType
      }

    }
    
    }else{

      return {
        "isBiometricAvailable": result.isAvailable,
        "biometryType": result.biometryType
      }

    }
    
  }
}
