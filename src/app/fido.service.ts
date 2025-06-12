import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map, Observable } from 'rxjs';
import {registrationOptionData, authenticationOptionData} from './mockResponses';

@Injectable({
  providedIn: 'root'
})
export class FidoService {

  constructor(private http: HttpClient) {}

  // Step 1: Fetch registration options from backend
  async getRegistrationOptions(): Promise<PublicKeyCredentialCreationOptions> {
    const responseObservable = this.http.post<PublicKeyCredentialCreationOptions>(
      'https://your-server.com/api/fido2/register-request',
      { username: 'user@example.com' }
    );
    //const response = await firstValueFrom(responseObservable);
    const response = registrationOptionData;
    response.challenge = this.base64urlToUint8Array(response.challenge as any);
    response.user.id = this.base64urlToUint8Array(response.user.id as any);

    return response;
  }

  // Step 2: Send new credential to backend
  async sendRegistrationResult(credential: Credential) {
    const publicKeyCredential = credential as PublicKeyCredential;
    const attestationResponse = publicKeyCredential.response as AuthenticatorAttestationResponse;

    const credentialData = {
      id: publicKeyCredential.id,
      rawId: this.uint8ArrayToBase64url(new Uint8Array(publicKeyCredential.rawId)),
      type: publicKeyCredential.type,
      response: {
        clientDataJSON: this.uint8ArrayToBase64url(new Uint8Array(attestationResponse.clientDataJSON)),
        attestationObject: this.uint8ArrayToBase64url(new Uint8Array(attestationResponse.attestationObject))
      }
    };

    return await firstValueFrom(this.http.post('https://your-server.com/api/fido2/register-response', credentialData));
  }

  async registerWithBiometrics(): Promise<void> {
    const options = await this.getRegistrationOptions();
    
    const credential = await navigator.credentials.create({ publicKey: options });
    let response = await this.sendRegistrationResult(credential!);//TODO Response status code 
    console.log('✅ Registration successful');
  }

  // Step 3: Fetch authentication options from backend
  async getAuthenticationOptions(): Promise<PublicKeyCredentialRequestOptions> {
    const responseObservable = this.http.post<PublicKeyCredentialRequestOptions>(
      'https://your-server.com/api/fido2/auth-request',
      { username: 'user@example.com' }
    );

    //const response = await firstValueFrom(responseObservable);
    const response = authenticationOptionData;

    // Convert challenge from base64url
    response.challenge = this.base64urlToUint8Array(response.challenge as any);

    // Convert allowCredentials.id from base64url
    if (response.allowCredentials) {
      response.allowCredentials = response.allowCredentials.map(cred => ({
        ...cred,
        id: this.base64urlToUint8Array(cred.id as any)
      }));
    }

    return response;
  }

  // Step 4: Send authentication result to backend
  async sendAuthenticationResult(assertion: Credential): Promise<void> {
    const publicKeyCredential = assertion as PublicKeyCredential;
    const assertionResponse = publicKeyCredential.response as AuthenticatorAssertionResponse;

    const assertionData = {
      id: publicKeyCredential.id,
      rawId: this.uint8ArrayToBase64url(new Uint8Array(publicKeyCredential.rawId)),
      type: publicKeyCredential.type,
      response: {
        clientDataJSON: this.uint8ArrayToBase64url(new Uint8Array(assertionResponse.clientDataJSON)),
        authenticatorData: this.uint8ArrayToBase64url(new Uint8Array(assertionResponse.authenticatorData)),
        signature: this.uint8ArrayToBase64url(new Uint8Array(assertionResponse.signature)),
        userHandle: assertionResponse.userHandle ? this.uint8ArrayToBase64url(new Uint8Array(assertionResponse.userHandle)) : null
      }
    };

    //let response = await firstValueFrom(this.http.post('https://your-server.com/api/fido2/auth-response', assertionData)); // TODO response status
  }

  async authenticateWithBiometrics(): Promise<void> {
    const options = await this.getAuthenticationOptions();
    const assertion = await navigator.credentials.get({ publicKey: options });
    await this.sendAuthenticationResult(assertion!);
    console.log('✅ Authentication successful');
  }

  // Helper: Convert Base64URL string to Uint8Array
  base64urlToUint8Array(base64url: string): Uint8Array {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

  // Helper: Convert Uint8Array to Base64URL string
  uint8ArrayToBase64url(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
