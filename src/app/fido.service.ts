import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map, Observable } from 'rxjs';
import  Fido  from './plugins/fido-plugin';
import {registrationOptionData, authenticationOptionData} from './mockResponses';
import { MatSnackBar } from '@angular/material/snack-bar';
import FidoAuthPlugin from './plugins/fido-auth-plugin';
import {FidoPluginPoc, FidoPluginPocPlugin} from '../../fido-plugin-poc/fido-plugin-poc/src';



@Injectable({
  providedIn: 'root'
})
export class FidoService {


  constructor(private http: HttpClient, readonly snackBar: MatSnackBar) {

  }

   SERVER_URL = "https://e0eb9dfc8a2c.ngrok-free.app";

  // Step 1: Fetch registration options from backend
  // Step 1: Fetch registration options from backend
  async getRegistrationOptions(email: string): Promise<any> {

 const responseObservable = await fetch(
   `${this.SERVER_URL}/init-register?email=${email}`,
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

  // Step 2: Send new credential to backend
  async sendRegistrationResult(credential: Credential) {

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
const verifyResponse = await fetch(`${this.SERVER_URL}/verify-register`, {
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
  console.log(JSON.stringify(verifyData));
  if (!verifyResponse.ok) {
    this.openSnackBar('Error ${verifyData.error}',"close")
  }
  if (verifyData.verified) {
    const response = await FidoPluginPoc.secureStorage({
      verificationJson: verifyData
    });
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
    console.log('registerWithBiometrics');
    /*const output = await FidoPluginPoc.echo({
      value: "Hello Plugin for ios testing",
    });*/
    if(email === undefined || email === null){
      this.openSnackBar('Please enter your email', "close");
      return;
    }
    try {
      const options = await this.getRegistrationOptions(email);

      //const credential = await navigator.credentials.create({ publicKey: options });
      const result = await FidoPluginPoc.register({
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

 if(email == undefined || email == null){
  this.openSnackBar('Email is needed',"close");

 }
  // 1. Get challenge from server
  const initResponse = await fetch(`${this.SERVER_URL}/init-auth?email=${email}`, {
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
  console.log('getAuthenticationOptions')
  console.log(options);
    //const response = await firstValueFrom(responseObservable);
    //const response = authenticationOptionData;

    // Convert challenge from base64url
    //options.challenge = this.base64urlToUint8Array(options.challenge as any);

    // Convert allowCredentials.id from base64url
    //if (options.allowCredentials) {
     // console.log('allow creds true');
     // options.allowCredentials = options.allowCredentials.map((cred: { id: any; }) => ({
      //  ...cred,
      //  id: this.base64urlToUint8Array(cred.id as any)
      //}));
    //}

    return options;
  }

  // Step 4: Send authentication result to backend
  async sendAuthenticationResult(assertion: Credential): Promise<void> {
    ;
    const publicKeyCredential = assertion as PublicKeyCredential;
    console.log('publicKeyCredential'+JSON.stringify(assertion))
    const assertionResponse = publicKeyCredential.response as AuthenticatorAssertionResponse;
console.log('assertionResponse'+JSON.stringify(assertionResponse));
console.log('clientDataJSON'+JSON.stringify(assertionResponse.clientDataJSON));
console.log('authenticatorData'+JSON.stringify(assertionResponse.authenticatorData));
console.log('signature'+JSON.stringify(assertionResponse.signature));

console.log("rawId bytes:", new Uint8Array(publicKeyCredential.rawId).length);
console.log("clientDataJSON bytes:", assertionResponse.clientDataJSON.byteLength);
console.log("authenticatorData bytes:", assertionResponse.authenticatorData.byteLength);
console.log("signature bytes:", assertionResponse.signature.byteLength);
console.log("userHandle bytes:", assertionResponse.userHandle?.byteLength);

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

    console.log('assertionData'+assertionData);
     // 3. Verify passkey with DB
  const verifyResponse = await fetch(`${this.SERVER_URL}/verify-auth`, {
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
    const response = await FidoPluginPoc.fetchSecureStorage();
    console.log('response from fetch secure storage');
    console.log(JSON.stringify(response));
    console.log(response.response.userName);
    const options = await this.getAuthenticationOptions(response.response.userName);
    console.log('authenticateWithBiometrics'+JSON.stringify(options));
    try{
//const assertion = await navigator.credentials.get({ publicKey: options });
/*const assertion = await FidoAuthPlugin.register({
        publicKeyCredentialRequestOptions: options,
      });*/ //--> this is for android
      const assertion = await FidoPluginPoc.authenticate({
        publicKeyCredentialRequestOptions: options,
      })
    console.log('assertion'+JSON.stringify(assertion));
    const asertionJson = JSON.parse(assertion.assertionJson);
    console.log('asertionJson'+JSON.stringify(asertionJson))
    await this.sendAuthenticationResult(asertionJson);
    }catch (err: any) {
  console.error("WebAuthn error:", err.name, err.message);
}


    console.log('✅ Authentication successful');
  }

  // Helper: Convert Base64URL string to Uint8Array

  /**
 * Decode a base64url string to a Uint8Array.
 */
 base64urlToUint8Array(base64url: string): Uint8Array {
  // Pad with '=' to make length a multiple of 4
  const padLength = (4 - (base64url.length % 4)) % 4
  const padded    = base64url + '='.repeat(padLength)

  // Convert from "base64url" to standard Base64
  const b64 = padded
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  // Decode the Base64 string to a binary string
  const binary = atob(b64)

  // Create a Uint8Array from char codes
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
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


/**
 * Helper to base64url-encode an ArrayBuffer or Uint8Array
 */
 bufferToBase64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}




}
