import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map, Observable } from 'rxjs';
import  Fido  from './plugins/fido-plugin';
import {registrationOptionData, authenticationOptionData} from './mockResponses';
import { MatSnackBar } from '@angular/material/snack-bar';
import FidoAuthPlugin from './plugins/fido-auth-plugin';

@Injectable({
  providedIn: 'root'
})
export class FidoService {

  constructor(private http: HttpClient, readonly snackBar: MatSnackBar) {}

  // Step 1: Fetch registration options from backend
  // Step 1: Fetch registration options from backend
  async getRegistrationOptions(email: string): Promise<any> {
  const SERVER_URL = "https://c4d8c7d35a88.ngrok-free.app";
 const responseObservable = await fetch(
   `${SERVER_URL}/init-register?email=${email}`,
   { credentials: "include" ,
    headers: {
      "ngrok-skip-browser-warning": "true",
      "Ngrok-Skip-Browser-Warning": "true"
    }

   },

 )
 console.log(responseObservable);
 const options = await responseObservable.json()
 //const response = await firstValueFrom(responseObservable);
 console.log(options);
 //const response = registrationOptionData;
 //options.challenge = this.uint8ArrayToBase64url(new TextEncoder().encode(options.challenge));
 //options.user.id = this.uint8ArrayToBase64url(new TextEncoder().encode(options.user.id));
 //response.challenge = this.base64urlToUint8Array(response.challenge as any);
 //response.user.id = this.base64urlToUint8Array(response.user.id as any);

 return options;
  }

  bufferToBase64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}


  // Step 2: Send new credential to backend
  async sendRegistrationResult(credential: Credential) {
    const SERVER_URL = "https://c4d8c7d35a88.ngrok-free.app";
    const publicKeyCredential = credential as PublicKeyCredential;
    console.log('publicKeyCredential'+JSON.stringify(publicKeyCredential))
    const attestationResponse = publicKeyCredential.response as AuthenticatorAttestationResponse;
    console.log('publicKeyCredential.response'+JSON.stringify(publicKeyCredential.response))
console.log('attestationResponse'+JSON.stringify(attestationResponse))
    const credentialData = {
      id: publicKeyCredential.id,
      rawId: publicKeyCredential.rawId,
      type: publicKeyCredential.type,
      response:{        
        clientDataJSON: attestationResponse.clientDataJSON,
        attestationObject: attestationResponse.attestationObject,
        transports: (publicKeyCredential.response as any).transports ?? [],
      },
      clientExtensionResults: publicKeyCredential.getClientExtensionResults?.() ?? {},
    };

    console.log('rawId'+ credentialData.rawId);
    console.log('clientDataJSON'+credentialData.response.clientDataJSON);

    try{
const verifyResponse = await fetch(`${SERVER_URL}/verify-register`, {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      "Ngrok-Skip-Browser-Warning": "true"
    },
    body: JSON.stringify(credentialData),
  })

  console.log('verify response');
  console.log(JSON.stringify(verifyResponse));

  const verifyData = await verifyResponse.json()
  console.log(verifyData);
  if (!verifyResponse.ok) {
    this.openSnackBar('Error ${verifyData.error}',"close")
  }
  if (verifyData.verified) {
    this.openSnackBar(`Successfully registered`,"close")
  } else {
    this.openSnackBar(`Failed to register`,"close")
  }
    }catch(error: any){
console.log("error in verify register"+error.message);
    }
    

    //return await firstValueFrom(this.http.post('https://your-server.com/api/fido2/register-response', credentialData));
  }

  async registerWithBiometrics(email: string): Promise<void> {
    if(email === undefined || email === null){
      this.openSnackBar('Please enter your email', "close");
      return;
    }
    try {
      const options = await this.getRegistrationOptions(email);
      console.log('options'+JSON.stringify(options));
      //const credential = await navigator.credentials.create({ publicKey: options });
      const result = await Fido.register({
        credentialJson: options,
      });
      console.log('result'+JSON.stringify(result));
      console.log(result);
      
      this.openSnackBar(JSON.stringify(result), "close");
      const parsedCredential = JSON.parse(result.credentialJson);

      let response = await this.sendRegistrationResult(parsedCredential);//TODO Response status code 
      console.log('✅ Registration successful');
    }
    catch(e: any) {
      console.log('error'+e.message)
      console.log(e.name);
      this.openSnackBar(`Error on navigator.credentials.create errorname: ${e.name} errorMessage: ${e.message}`, "close");
    }
  }

  // Step 3: Fetch authentication options from backend
  async getAuthenticationOptions(email: string): Promise<PublicKeyCredentialRequestOptions> {
    const responseObservable = this.http.post<PublicKeyCredentialRequestOptions>(
      'https://your-server.com/api/fido2/auth-request',
      { username: 'user@example.com' }
    );

    const SERVER_URL = "https://c4d8c7d35a88.ngrok-free.app";
 if(email == undefined || email == null){
  this.openSnackBar('Email is needed',"close");
  
 }
  // 1. Get challenge from server
  const initResponse = await fetch(`${SERVER_URL}/init-auth?email=${email}`, {
    credentials: "include",
    headers: {
      "ngrok-skip-browser-warning": "true",
      "Ngrok-Skip-Browser-Warning": "true"
    }
  })
  const options = await initResponse.json()
  if (!initResponse.ok) {
    console.log(options.error);
    this.openSnackBar('Error in getting user auth:',"close");
    
  }
  console.log('getAuthenticationOptions'+JSON.stringify(options))
    //const response = await firstValueFrom(responseObservable);
    //const response = authenticationOptionData;

    // Convert challenge from base64url
    //options.challenge = this.base64urlToUint8Array(options.challenge as any);

    // Convert allowCredentials.id from base64url
    //if (options.allowCredentials) {
      //console.log('allow creds true');
      //options.allowCredentials = options.allowCredentials.map((cred: { id: any; }) => ({
       // ...cred,
       // id: this.base64urlToUint8Array(cred.id as any)
      //}));
   // }

    return options;
  }

  // Step 4: Send authentication result to backend
  async sendAuthenticationResult(assertion: Credential): Promise<void> {
    const SERVER_URL = "https://c4d8c7d35a88.ngrok-free.app";
    const publicKeyCredential = assertion as PublicKeyCredential;
    console.log('publicKeyCredential'+JSON.stringify(assertion))
    const assertionResponse = publicKeyCredential.response as AuthenticatorAssertionResponse;
console.log('assertionResponse'+JSON.stringify(assertionResponse));
    
    const assertionData = {
      id: publicKeyCredential.id,
      rawId: publicKeyCredential.rawId,
      type: publicKeyCredential.type,
      authenticatorAttachment: publicKeyCredential.authenticatorAttachment,
      response: {
        clientDataJSON: assertionResponse.clientDataJSON,
        authenticatorData: assertionResponse.authenticatorData,
        signature: assertionResponse.signature,
        userHandle: assertionResponse.userHandle ? assertionResponse.userHandle : null,
      },
      clientExtensionResults: publicKeyCredential.getClientExtensionResults?.() ?? {},
    };

     // 3. Verify passkey with DB
  const verifyResponse = await fetch(`${SERVER_URL}/verify-auth`, {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      "Ngrok-Skip-Browser-Warning": "true"
    },
    body: JSON.stringify(assertionData),
  })

  const verifyData = await verifyResponse.json()
  console.log('verifyData'+JSON.stringify(verifyData));
  if (!verifyResponse.ok) {
    console.log(verifyData.error)
  }
  if (verifyData.verified) {
    this.openSnackBar(`Successfully logged in`,"close")
  } else {
    this.openSnackBar(`Failed to log in`,"close")
  }
    //let response = await firstValueFrom(this.http.post('https://your-server.com/api/fido2/auth-response', assertionData)); // TODO response status
  }

  async authenticateWithBiometrics(email: string): Promise<void> {
    const options = await this.getAuthenticationOptions(email);
    console.log('authenticateWithBiometrics'+JSON.stringify(options));
    try{
//const assertion = await navigator.credentials.get({ publicKey: options });
const assertion = await FidoAuthPlugin.register({
        publicKeyCredentialRequestOptions: options,
      });
    console.log('assertion'+JSON.stringify(assertion));
    await this.sendAuthenticationResult(JSON.parse(assertion.assertionJson));
    }catch (err: any) {
  console.error("WebAuthn error:", err.name, err.message);
}

    
    console.log('✅ Authentication successful');
  }

  // Helper: Convert Base64URL string to Uint8Array
  base64urlToUint8Array(base64url: string): Uint8Array {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

  // Helper: Convert Uint8Array to Base64URL string
  uint8ArrayToBase64url(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 4000,
      panelClass: 'my-custom-snackbar'
    });
  }


}
