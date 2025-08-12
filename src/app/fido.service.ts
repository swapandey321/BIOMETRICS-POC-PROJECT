import { Injectable, input } from '@angular/core';
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


  async getRegistrationOptions(username: string): Promise<any> {

    console.log('getRegistrationOptions');
    
    //prepare the url first
    const url = 'https://auth.pingone.com/18eba607-71f1-4365-b16a-4e2305a8798d/as/authorize?response_type=code&response_mode=pi.flow&scope=openid&client_id=663b58f2-6203-4bfb-9473-fd3f0ce050ad';
    
    const options = await this.getIdFromPing(url);

    //get the id and retrieve the fido challenge
    console.log('id from getIdFromPing',JSON.parse(options).id)
    const registrationOptions = await this.getPingFidoChallenge(JSON.parse(options).id , username);

    
    // Parse the full JSON response
    const responseData = JSON.parse(registrationOptions);
    // Navigate the nested object to find the FIDO challenge
    const fidoChallengeInput = responseData?.form?.components?.inputs?.find(
      (input: {key: string}) => input.key === 'fidoChallenge');
      
    const parsedRegistrationOption = JSON.parse(fidoChallengeInput.value);

    console.log('Raw registration options:');
    console.log(JSON.stringify(parsedRegistrationOption));

    const challengeBase64Url = this.toBase64Url(parsedRegistrationOption.challenge);
    parsedRegistrationOption.challenge = challengeBase64Url;
    console.log('base64 url encoded challenge'+challengeBase64Url)

    // 2. Convert the 'user.id' byte array to a Base64URL string
    const userIdBase64Url = this.toBase64Url(parsedRegistrationOption.user.id);
    console.log('base 64 url encoded user id'+userIdBase64Url);
    parsedRegistrationOption.user.id = userIdBase64Url;
    //check for exclude credential - for first time user this will be empty array
    if (parsedRegistrationOption.excludeCredentials) {
      parsedRegistrationOption.excludeCredentials = parsedRegistrationOption.excludeCredentials.map((cred: { id: any; }) => ({
        ...cred,
        id: this.toBase64Url(cred.id as any)
      }));
    }
  // Now you can access the individual WebAuthn properties
    console.log('base64 url encoded Registration Options:');
    console.log(JSON.stringify(parsedRegistrationOption));
   
     const registrationOptionData = {
       id: responseData.id,
       registrationOptions: parsedRegistrationOption
     }

    return registrationOptionData;
  }

  // Step 2: Send new credential to backend
  async sendRegistrationResult(attestationData: any) {

    try{
      //prepare the url 
    const url = 'https://auth.pingone.com/18eba607-71f1-4365-b16a-4e2305a8798d/davinci/connections/481e952e6b11db8360587b8711620786/capabilities/customHTMLTemplate';

    console.log('request body')
    console.log(JSON.stringify(attestationData));

    const response = await fetch(`${url}`, {
      method: "POST",
      // Add the Content-Type header
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "ping-sdk"
      },
      redirect: "follow",
      body: JSON.stringify(attestationData),
    });

    console.log('attestation response status:', response.status);

    const result = await response.text();
    console.log('attestation raw response body:', result); // Log the raw body

    // Parse the full JSON response
    const responseData = JSON.parse(result);
    console.log(responseData);
    
    return responseData;

    } catch (error: any) {
      console.log("error in verifying attestation data" + error.message);
    }

  }

  async registerWithBiometrics(username: string): Promise<void> {

    console.log('registerWithBiometrics');
    
    try {
      const registrationOptionData = await this.getRegistrationOptions(username);

      console.log('options received from pingone');
      console.log(JSON.stringify(registrationOptionData));
      const result = await FidoPluginPoc.register({
        credentialJson: registrationOptionData.registrationOptions,
      });
      console.log('result' + JSON.stringify(result));
      const parsedAttestation = JSON.parse(result.credentialJson)
      console.log('parsedAttestation');
      console.log(parsedAttestation);

      //prepare the json object to be sent to ping one

      const attestationData = {
    "id": registrationOptionData.id,
    "eventName": "continue",
    "parameters": {
        "eventType": "submit",
        "data": {
            "formData": {
                "attestationValue": parsedAttestation
            }
        }
    }
}
      let response = await this.sendRegistrationResult(attestationData);//TODO Response status code
      const registrationResponse = response.formData.value
      if(registrationResponse.success){
        console.log('✅ Registration successful');
        //store the login preference and redirect the user to PSC overview page

      }
      
    } catch (e: any) {
      console.log('error' + e.message)
      console.log(e.name);
      
    }
  }

  // Step 3: Fetch authentication options from backend
  async getAuthenticationOptions(username: string): Promise<any> {

    console.log('getAuthenticationOptions');

    //prepare the url first
    const url = 'https://auth.pingone.com/18eba607-71f1-4365-b16a-4e2305a8798d/as/authorize?response_type=code&response_mode=pi.flow&scope=openid&client_id=7fbb3b2c-9758-4d2d-bd33-5e86bb8f0a4b';

     const options = await this.getIdFromPing(url);

    //get the id and retrieve the fido challenge
    console.log('id from getIdFromPing',JSON.parse(options).id)
    const authenticationOptions = await this.getPingFidoChallenge(JSON.parse(options).id , username);

    
    // Parse the full JSON response
    const responseData = JSON.parse(authenticationOptions);
    // Navigate the nested object to find the FIDO challenge
    const fidoChallengeInput = responseData?.form?.components?.inputs?.find(
      (input: {key: string}) => input.key === 'fidoChallenge');
      
    const parsedAuthenticationOption = JSON.parse(fidoChallengeInput.value);

    console.log('Raw authentication options:');
    console.log(JSON.stringify(parsedAuthenticationOption));

    const challengeBase64Url = this.toBase64Url(parsedAuthenticationOption.challenge);
    parsedAuthenticationOption.challenge = challengeBase64Url;
    console.log('base64 url encoded challenge'+challengeBase64Url)

    //check for allow credential 
    if (parsedAuthenticationOption.allowCredentials) {
      parsedAuthenticationOption.allowCredentials = parsedAuthenticationOption.allowCredentials.map((cred: { id: any; }) => ({
        ...cred,
        id: this.toBase64Url(cred.id as any)
      }));
    }
  // Now you can access the individual WebAuthn properties
    console.log('base64 url encoded Authentication Options:');
    console.log(JSON.stringify(parsedAuthenticationOption));
   
     const authenticationOptionData = {
       id: responseData.id,
       authenticationOptions: parsedAuthenticationOption
     }

    return authenticationOptionData;
    
  }

  // Step 4: Send authentication result to backend
  async sendAuthenticationResult(assertionData: any) {
    
    console.log('sendAuthenticationResult' + JSON.stringify(assertionData));

    try{

    const url = 'https://auth.pingone.com/18eba607-71f1-4365-b16a-4e2305a8798d/davinci/connections/481e952e6b11db8360587b8711620786/capabilities/customHTMLTemplate';

    console.log('reuqst body')
    console.log(JSON.stringify(assertionData));

    const response = await fetch(`${url}`, {
      method: "POST",
      // Add the Content-Type header
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "ping-sdk"
      },
      redirect: "follow",
      body: JSON.stringify(assertionData),
    });

    console.log('assertion response status:', response.status);

    const result = await response.text();
    console.log('assertion raw response body:', result); // Log the raw body

    // Parse the full JSON response
    const responseData = JSON.parse(result);
    console.log(responseData);
    
    return responseData;
    }catch(err: any){

      console.log('Error in verifying assertion data', err.message);
    }
    
  }

  async authenticateWithBiometrics(username: string): Promise<void> {
    console.log('authenticateWithBiometrics');
   
    try {
      const authenticationOptionData = await this.getAuthenticationOptions(username);

      const result = await FidoPluginPoc.authenticate({
        publicKeyCredentialRequestOptions: authenticationOptionData.authenticationOptions
      })
      console.log('assertion' + JSON.stringify(result));
      const parsedAssertion = JSON.parse(result.assertionJson);
      console.log('asertionJson' + JSON.stringify(parsedAssertion))

      const assertionData = {
    "id": authenticationOptionData.id,
    "eventName": "continue",
    "parameters": {
        "eventType": "submit",
        "data": {
            "formData": {
                "assertionValue": parsedAssertion
            }
        }
    }
}

    console.log('request body')
    console.log(JSON.stringify(assertionData));

    let authenticationResponse = await this.sendAuthenticationResult(assertionData);//TODO Response status code
      
      if(authenticationResponse.success){
        console.log('✅ Authentication successful');
        //redirect the user to PSC Overview screen
      
      }
      
    } catch (err: any) {
      console.error("WebAuthn error:", err.name, err.message);
    }

    
  }

  // Helper: Convert Base64URL string to Uint8Array

  /**
   * Decode a base64url string to a Uint8Array.
   */
  base64urlToUint8Array(base64url: string): Uint8Array {
    // Pad with '=' to make length a multiple of 4
    const padLength = (4 - (base64url.length % 4)) % 4
    const padded = base64url + '='.repeat(padLength)

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

  // The input byteArray is an array of signed numbers (Int8)
// We need to convert them to unsigned 8-bit integers (Uint8)
// before creating the string for btoa().
  toBase64Url(byteArray: number[]): string {
    const uint8Array = new Uint8Array(byteArray);
    let binary = '';

    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }

    const base64 = btoa(binary);

    // Now, convert standard Base64 to Base64URL format
    const base64Url = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return base64Url;
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

 

  async getIdFromPing(url: string): Promise<any>  {

    console.log('getIdFromPing()');

    if(url){

       try {
      // The `await` keyword pauses execution until the fetch promise resolves.
      const response = await fetch(`${url}`, {
      method: "GET",
      // Add the Content-Type header
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "ping-sdk",

      },
      redirect: "follow"
      
    });
    
      const textBody = await response.text();
     //const options =  await this.getAuthFidoChallenge(JSON.parse(textBody).id);
     console.log(textBody);
     return textBody;
    } catch (error) {
      console.error('An error occurred:', error);
    }

    }
    
  }

  async getPingFidoChallenge(id: string , username: string): Promise<any>{

    console.log('getPingFidoChallenge');

    //prepare url
    const url = 'https://auth.pingone.com/18eba607-71f1-4365-b16a-4e2305a8798d/davinci/connections/481e952e6b11db8360587b8711620786/capabilities/customHTMLTemplate';
    
    const passInUserRequestBody= {
    "id": id,
    "eventName": "continue",
    "parameters": {
        "eventType": "submit",
        "data": {
            "formData": {
                "username": username
            }
        }
    }
}


    console.log('Fido challenge request body:', passInUserRequestBody);

    const response = await fetch(`${url}`, {
      method: "POST",
      // Add the Content-Type header
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "ping-sdk"
      },
      redirect: "follow",
      body: JSON.stringify(passInUserRequestBody),
    });

    console.log('Fido challenge response status:', response.status, response.statusText);

    // If the response is not OK, throw an error to catch it below
    if (!response.ok) {
      console.log('Failed to get Fido Challenge');
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    console.log('fido challenge raw response body:', result); // Log the raw body

    return result;

  }


}
