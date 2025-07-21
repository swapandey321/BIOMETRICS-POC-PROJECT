import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
/*import {
    NativeBiometric,
    BiometryType,
    BiometricOptions,
    SetCredentialOptions,
    AvailableResult
} from "@capgo/capacitor-native-biometric";*/
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-biom',
  imports: [MatButtonModule],
  templateUrl: './biom.component.html',
  styleUrl: './biom.component.scss'
})
export class BiomComponent {

  constructor(readonly snackBar: MatSnackBar) {}

  credentials: any = {userName: '',password: ''}

  serverId = 'BiometricPoCApp';

  /*verifyOptions: BiometricOptions = {
              reason: "Please authenticate with your biometrics.", // For iOS
              title: "Authenticate with biometrics", // For Android
              subtitle: "Confirm it's you", // For Android
              description: "We need to verify your identity before proceeding.", // For Android
              // negativeButtonText: "Cancel", // Optional: Customize cancel button text on Android
              // useFallback: false, // Optional: Set to true to allow device PIN/Pattern if biometrics fail/unavailable
                                  // Be cautious with this if your intent is strictly biometrics.
          };*/

  valueChanged(e: Event, fieldName: string) {
    this.credentials[fieldName] = (e.target as HTMLInputElement).value;
  }
  async setCredentials() {
    /*try {
      const availability: AvailableResult = await NativeBiometric.isAvailable();
      if (this.credentials.userName === '' || this.credentials.password === '') {
        this.openSnackBar('Enter credentials first', 'close');
      }
      if (!availability.isAvailable) {
        this.openSnackBar('Biometric not available in the device', 'close');
        return
      }


          //Prompts user for biometric
      await NativeBiometric.verifyIdentity(this.verifyOptions);

      await NativeBiometric.setCredentials({
          username: this.credentials.userName,
          password: this.credentials.password,
          server: this.serverId,
      } as SetCredentialOptions);
    }
    catch(error: any) {
      this.openSnackBar('Biometric not available in the device', 'close');
    }*/
  }

  async showCredentials() {
   /* try {
      const availability: AvailableResult = await NativeBiometric.isAvailable();
      await NativeBiometric.verifyIdentity(this.verifyOptions);
      let savedCreds = await NativeBiometric.getCredentials({
        server: this.serverId,
      });
      this.openSnackBar(`User:: ${savedCreds.username} password:: ${savedCreds.password}`, 'Close')
   }
    catch (error: any) {
      console.error("Failed to get token or biometric auth failed/cancelled:", error);
      // Handle specific errors if needed (e.g., error codes from the plugin for cancellation)
      this.openSnackBar('Error in retrieving secret', 'Close');
    }*/

  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 4000,
      panelClass: 'my-custom-snackbar'
    });
  }
}
