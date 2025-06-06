import { Component, OnInit } from '@angular/core';

// Helper functions for ArrayBuffer to Base64Url and vice-versa
const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const base64UrlToArrayBuffer = (base64url: string): ArrayBuffer => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad === 2 ? base64 + '==' : pad === 3 ? base64 + '=' : base64;
  const binary_string = atob(padded);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

// --- Mock Backend (Simulates server-side logic and user data) ---
interface UserData {
  userId: string;
  passkeyPublicKeys: { credentialId: string; publicKey: string }[];
}

const mockBackend = {
  users: {} as { [username: string]: UserData },

  async getRegistrationChallenge(username: string) {
    console.log(`[Mock Backend] Generating registration challenge for ${username}`);
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const excludeCredentials = this.users[username]?.passkeyPublicKeys.map(pk => ({
      id: base64UrlToArrayBuffer(pk.credentialId),
      type: 'public-key',
      transports: ['internal'] as AuthenticatorTransport[],
    })) || [];

    return {
      rp: {
        name: "My Capacitor App",
        id: window.location.hostname,
      },
      user: {
        id: arrayBufferToBase64Url(userId),
        name: username,
        displayName: username,
      },
      challenge: arrayBufferToBase64Url(challenge),
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      timeout: 60000,
      attestation: "direct" as AttestationConveyancePreference,
      authenticatorSelection: {
        authenticatorAttachment: "platform" as AuthenticatorAttachment,
        residentKey: "required" as ResidentKeyRequirement,
        requireResidentKey: true,
        userVerification: "preferred" as UserVerificationRequirement,
      },
      excludeCredentials: excludeCredentials,
    };
  },

  async verifyRegistration(credential: any) { // Type 'any' for simplicity due to complex WebAuthn Credential types
    console.log("[Mock Backend] Verifying registration credential:", credential);

    const credentialId = credential.id;
    // Mock extraction of username from clientDataJSON origin for demo
    const clientData = JSON.parse(atob(credential.response.clientDataJSON));
    const username = clientData.origin.split('.')[0]; 

    if (!this.users[username]) {
      this.users[username] = {
        userId: clientData.challenge, // Mock user ID
        passkeyPublicKeys: []
      };
    }

    this.users[username].passkeyPublicKeys.push({
      credentialId: credentialId,
      publicKey: credential.response.publicKey || 'mockPublicKeyData',
    });

    console.log(`[Mock Backend] User ${username} registered passkey ${credentialId}. Current users:`, this.users);
    return { success: true, message: "Passkey registered successfully!" };
  },

  async getAuthenticationChallenge(username: string) {
    console.log(`[Mock Backend] Generating authentication challenge for ${username}`);
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const user = this.users[username];
    if (!user || user.passkeyPublicKeys.length === 0) {
      return { error: true, message: "No passkeys registered for this user. Please register first." };
    }

    const allowCredentials = user.passkeyPublicKeys.map(pk => ({
      id: base64UrlToArrayBuffer(pk.credentialId),
      type: 'public-key' as PublicKeyCredentialType,
      transports: ['internal'] as AuthenticatorTransport[],
    }));

    return {
      challenge: arrayBufferToBase64Url(challenge),
      rpId: window.location.hostname,
      timeout: 60000,
      userVerification: "preferred" as UserVerificationRequirement,
      allowCredentials: allowCredentials,
    };
  },

  async verifyAuthentication(credential: any) { // Type 'any' for simplicity
    console.log("[Mock Backend] Verifying authentication credential:", credential);

    const credentialId = credential.id;
    // Mock extraction of username from clientDataJSON origin for demo
    const clientData = JSON.parse(atob(credential.response.clientDataJSON));
    const username = clientData.origin.split('.')[0]; 

    const user = this.users[username];
    if (!user) {
      return { success: false, message: "User not found." };
    }

    const matchingPasskey = user.passkeyPublicKeys.find(pk => pk.credentialId === credentialId);

    if (matchingPasskey) {
      console.log(`[Mock Backend] Passkey ${credentialId} for user ${username} authenticated successfully.`);
      return { success: true, message: `Authenticated successfully for ${username} with Passkey!` };
    } else {
      console.log(`[Mock Backend] Passkey ${credentialId} for user ${username} not found or mismatch.`);
      return { success: false, message: "Authentication failed. Passkey not recognized." };
    }
  },
};

@Component({
  selector: 'app-passkey-auth',
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 font-inter">
      <div class="bg-white rounded-xl shadow-2xl p-6 sm:p-10 w-full max-w-md flex flex-col items-center">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-6 text-center">
          Passkey Demo
        </h1>

        <p class="text-gray-600 text-center mb-8">
          Experience passwordless authentication with FIDO2 Passkeys.
          Your biometric data never leaves your device.
        </p>

        <div class="w-full mb-6">
          <label for="username" class="block text-gray-700 text-sm font-medium mb-2">
            Username:
          </label>
          <input
            type="text"
            id="username"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            placeholder="Enter a username"
            [(ngModel)]="username"
            [disabled]="loading"
          />
        </div>

        <div class="w-full space-y-4">
          <button
            (click)="handleRegisterPasskey()"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="loading || !isWebAuthnSupported"
          >
            <!-- No icon due to package change, using text instead -->
            {{ loading ? 'Registering...' : 'Register Passkey' }}
          </button>

          <button
            (click)="handleAuthenticatePasskey()"
            class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="loading || !isWebAuthnSupported"
          >
            <!-- No icon due to package change, using text instead -->
            {{ loading ? 'Authenticating...' : 'Authenticate with Passkey' }}
          </button>
        </div>

        <ng-container *ngIf="message">
          <div class="mt-8 p-4 rounded-lg w-full flex items-center"
            [ngClass]="{
              'bg-green-100 text-green-800': messageType === 'success',
              'bg-red-100 text-red-800': messageType === 'error',
              'bg-blue-100 text-blue-800': messageType === 'info'
            }">
            <p class="text-sm font-medium">{{ message }}</p>
          </div>
        </ng-container>

        <ng-container *ngIf="!isWebAuthnSupported">
          <div class="mt-4 text-red-600 text-sm text-center">
            Your browser/device may not support the WebAuthn API required for Passkeys.
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [] // Tailwind CSS will be processed globally
})
export class PasskeyAuthComponent implements OnInit {
  username: string = '';
  message: string = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  loading: boolean = false;
  isWebAuthnSupported: boolean = false;

  constructor() {}

  ngOnInit(): void {
    if (window.PublicKeyCredential) {
      this.isWebAuthnSupported = true;
    } else {
      this.displayMessage('WebAuthn (Passkey) is not supported in this browser/environment.', 'error');
    }
  }

  displayMessage(msg: string, type: 'success' | 'error' | 'info'): void {
    this.message = msg;
    this.messageType = type;
  }

  async handleRegisterPasskey(): Promise<void> {
    if (!this.isWebAuthnSupported) {
      this.displayMessage('WebAuthn not supported.', 'error');
      return;
    }
    if (!this.username) {
      this.displayMessage('Please enter a username to register.', 'error');
      return;
    }

    this.loading = true;
    this.displayMessage('Initiating passkey registration...', 'info');

    try {
      const options = await mockBackend.getRegistrationChallenge(this.username);

      // Convert challenges and user IDs to ArrayBuffer for WebAuthn API
      // Note: TypeScript types for `PublicKeyCredentialCreationOptions` are complex.
      // Casting to `any` for PublicKeyCredentialCreationOptions and PublicKeyCredentialRequestOptions
      // simplifies the demo but in a real app, strict typing would be preferred.
      (options as any).challenge = base64UrlToArrayBuffer(options.challenge);
      (options.user as any).id = base64UrlToArrayBuffer(options.user.id);
      (options.rp as any).id = options.rp.id;

      const credential = await navigator.credentials.create({
        publicKey: options as PublicKeyCredentialCreationOptions,
      });

      const registeredCredential = {
        id: credential.id,
        rawId: arrayBufferToBase64Url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: arrayBufferToBase64Url((credential.response as AuthenticatorAttestationResponse).clientDataJSON),
          attestationObject: arrayBufferToBase64Url((credential.response as AuthenticatorAttestationResponse).attestationObject),
        },
      };

      const response = await mockBackend.verifyRegistration(registeredCredential);

      if (response.success) {
        this.displayMessage(response.message, 'success');
      } else {
        this.displayMessage(response.message, 'error');
      }
    } catch (error: any) {
      console.error('Passkey registration failed:', error);
      this.displayMessage(`Registration failed: ${error.message || 'Unknown error.'}`, 'error');
    } finally {
      this.loading = false;
    }
  }

  async handleAuthenticatePasskey(): Promise<void> {
    if (!this.isWebAuthnSupported) {
      this.displayMessage('WebAuthn not supported.', 'error');
      return;
    }
    if (!this.username) {
      this.displayMessage('Please enter a username to authenticate.', 'error');
      return;
    }
    if (!mockBackend.users[this.username] || mockBackend.users[this.username].passkeyPublicKeys.length === 0) {
      this.displayMessage('No passkeys registered for this user. Please register first.', 'error');
      return;
    }

    this.loading = true;
    this.displayMessage('Initiating passkey authentication...', 'info');

    try {
      const options = await mockBackend.getAuthenticationChallenge(this.username);
      if ((options as any).error) {
        this.displayMessage((options as any).message, 'error');
        this.loading = false;
        return;
      }

      (options as any).challenge = base64UrlToArrayBuffer(options.challenge);
      (options as any).allowCredentials = options.allowCredentials.map((cred: any) => ({
        ...cred,
        id: base64UrlToArrayBuffer(cred.id)
      }));

      const credential = await navigator.credentials.get({
        publicKey: options as PublicKeyCredentialRequestOptions,
      });

      const authenticatedCredential = {
        id: credential.id,
        rawId: arrayBufferToBase64Url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: arrayBufferToBase64Url((credential.response as AuthenticatorAssertionResponse).clientDataJSON),
          authenticatorData: arrayBufferToBase64Url((credential.response as AuthenticatorAssertionResponse).authenticatorData),
          signature: arrayBufferToBase64Url((credential.response as AuthenticatorAssertionResponse).signature),
          userHandle: (credential.response as AuthenticatorAssertionResponse).userHandle ? arrayBufferToBase64Url((credential.response as AuthenticatorAssertionResponse).userHandle!) : null,
        },
      };

      const response = await mockBackend.verifyAuthentication(authenticatedCredential);

      if (response.success) {
        this.displayMessage(response.message, 'success');
      } else {
        this.displayMessage(response.message, 'error');
      }
    } catch (error: any) {
      console.error('Passkey authentication failed:', error);
      this.displayMessage(`Authentication failed: ${error.message || 'Unknown error.'}`, 'error');
    } finally {
      this.loading = false;
    }
  }
}

// In your Angular application, you would typically include this component
// in a module (e.g., AppModule or a dedicated AuthModule) and declare it.
// Then, you would use it in your app.component.html or a routing path.

// Example for app.module.ts (not part of this immersive, just for context):
/*
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { PasskeyAuthComponent } from './passkey-auth.component'; // Assuming file path

@NgModule({
  declarations: [
    PasskeyAuthComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [PasskeyAuthComponent] // Or another root component
})
export class AppModule { }
*/

// Example for app.component.html (not part of this immersive, just for context):
/*
<app-passkey-auth></app-passkey-auth>
*/
