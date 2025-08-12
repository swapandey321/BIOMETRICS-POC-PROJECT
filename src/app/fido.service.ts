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

  SERVER_URL = "https://e0eb9dfc8a2c.ngrok-free.app";

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
    const url = 'https://auth.pingone.com/18eba607-71f1-4365-b16a-4e2305a8798d/davinci/connections/481e952e6b11db8360587b8711620786/capabilities/customHTMLTemplate';

    console.log('reuqst body')
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

    console.log('attestation response status:', response.status, response.statusText);

    // If the response is not OK, throw an error to catch it below
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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
      console.log('result' + JSON.stringify(result.credentialJson));
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
        //store the login preference 

      }
      
    } catch (e: any) {
      console.log('error' + e.message)
      console.log(e.name);
      
    }
  }

  // Step 3: Fetch authentication options from backend
  async getAuthenticationOptions(email: string): Promise<PublicKeyCredentialRequestOptions> {

    if (email == undefined || email == null) {
      this.openSnackBar('Email is needed', "close");

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
      this.openSnackBar('Error in getting user auth:', "close");

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
    console.log('publicKeyCredential' + JSON.stringify(assertion))
    const assertionResponse = publicKeyCredential.response as AuthenticatorAssertionResponse;
    console.log('assertionResponse' + JSON.stringify(assertionResponse));
    console.log('clientDataJSON' + JSON.stringify(assertionResponse.clientDataJSON));
    console.log('authenticatorData' + JSON.stringify(assertionResponse.authenticatorData));
    console.log('signature' + JSON.stringify(assertionResponse.signature));

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

    console.log('assertionData' + assertionData);
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
    console.log('verifyData' + JSON.stringify(verifyData));
    if (!verifyResponse.ok) {
      console.log(verifyData.error)
    }
    if (verifyData.verified) {
      this.openSnackBar(`Successfully logged in`, "close")
    } else {
      this.openSnackBar(`Failed to log in`, "close")
    }
    //let response = await firstValueFrom(this.http.post('https://your-server.com/api/fido2/auth-response', assertionData)); // TODO response status
  }

  async authenticateWithBiometrics(username: string): Promise<void> {
    console.log('authenticateWithBiometrics');
    const options = await this.getAuthId();
    console.log('authenticateWithBiometrics' + JSON.stringify(options));
    try {
//const assertion = await navigator.credentials.get({ publicKey: options });
      /*const assertion = await FidoAuthPlugin.register({
              publicKeyCredentialRequestOptions: options,
            });*/ //--> this is for android
      // const assertion = await FidoPluginPoc.authenticate({
      //   publicKeyCredentialRequestOptions: options,
      // })
      // console.log('assertion' + JSON.stringify(assertion));
      // const asertionJson = JSON.parse(assertion.assertionJson);
      // console.log('asertionJson' + JSON.stringify(asertionJson))

      const url = 'https://auth.pingone.com/18eba607-71f1-4365-b16a-4e2305a8798d/davinci/connections/481e952e6b11db8360587b8711620786/capabilities/customHTMLTemplate';

      const assertion = {
  "id": options.id,
  "nextEvent": {
    "constructType": "skEvent",
    "eventName": "continue",
    "params": [],
    "eventType": "post",
    "postProcess": {}
  },
  "parameters": {
    "assertionValue": options.assertionData
  },
  "eventName": "continue"
}

    console.log('reuqst body')
    console.log(JSON.stringify(assertion));


    const response = await fetch(`${url}`, {
      method: "POST",
      // Add the Content-Type header
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(assertion),
    });

    console.log('assertion response status:', response.status, response.statusText);

    // If the response is not OK, throw an error to catch it below
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    console.log('assertion raw response body:', result); // Log the raw body

    // Parse the full JSON response
    const responseData = JSON.parse(result);
    console.log(responseData);
      
    } catch (err: any) {
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

  async getId(): Promise<any>  {
    console.log('getId called');

    const url = 'https://auth.pingone.com/18eba607-71f1-4365-b16a-4e2305a8798d/as/authorize?response_type=code&response_mode=pi.flow&scope=openid&client_id=663b58f2-6203-4bfb-9473-fd3f0ce050ad';

    try {
      // The `await` keyword pauses execution until the fetch promise resolves.
      const response = await fetch(url);
      console.log('response from pingone');

      // The `response` object needs to be processed to get its body content.
      const textBody = await response.text();
      console.log(textBody);
      console.log('getting the id param')
      console.log(JSON.parse(textBody).id);
     const options =  await this.getFidoChallenge(JSON.parse(textBody).id);
     console.log(options);
     return options
    } catch (error) {
      console.error('An error occurred:', error);
    }

  }

  async getFidoChallenge(id: string): Promise<any>  {
    const url = 'https://auth.pingone.com/18eba607-71f1-4365-b16a-4e2305a8798d/davinci/connections/481e952e6b11db8360587b8711620786/capabilities/customHTMLTemplate';
    const requestBody = {
      "id": id,
      "nextEvent": {
        "constructType": "skEvent",
        "eventName": "continue",
        "params": [],
        "eventType": "post",
        "postProcess": {}
      },
      "parameters": {
        "username": "testuser-8-8-25",
        "buttonType": "form-submit",
        "buttonValue": "submit"
      },
      "eventName": "continue"
    };
    console.log('Fido challenge request body:', requestBody);

    const response = await fetch(`${url}`, {
      method: "POST",
      // Add the Content-Type header
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Fido challenge response status:', response.status, response.statusText);

    // If the response is not OK, throw an error to catch it below
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    console.log('fido challenge raw response body:', result); // Log the raw body

    // Parse the full JSON response
    const responseData = JSON.parse(result);

// Navigate the nested object to find the FIDO challenge
    const fidoChallengeData = responseData.screen.properties.fidoChallenge.value;

    console.log('The entire FIDO2 challenge object is:');
    console.log(JSON.stringify(fidoChallengeData));

    //base64 url encoded challengeme1z9OqpyDh-73hKzT_jW0tG_VokgIyfx2EsLG_adzI
    // base 64 url encoded user idHOjFLgmoUY_-38-Xa57oY8vXLE0L2hIIM18lLAmID6w

    const challengeBase64Url = this.toBase64Url(fidoChallengeData.challenge);
    fidoChallengeData.challenge = challengeBase64Url;
    console.log('base64 url encoded challenge'+challengeBase64Url)

    // 2. Convert the 'user.id' byte array to a Base64URL string
    const userIdBase64Url = this.toBase64Url(fidoChallengeData.user.id);
    console.log('base 64 url encoded user id'+userIdBase64Url);
    fidoChallengeData.user.id = userIdBase64Url;
    if (fidoChallengeData.excludeCredentials) {
      fidoChallengeData.excludeCredentials = fidoChallengeData.excludeCredentials.map((cred: { id: any; }) => ({
        ...cred,
        id: this.toBase64Url(cred.id as any)
      }));
    }
// Now you can access the individual WebAuthn properties
    console.log('The entire FIDO2 challenge updated object is:');
    console.log(JSON.stringify(fidoChallengeData));


//     const postFido = {
//   "id": responseData.id,
//   "nextEvent": {
//     "constructType": "skEvent",
//     "eventName": "continue",
//     "params": [],
//     "eventType": "post",
//     "postProcess": {}
//   },
//   "parameters": {
//   },
//   "eventName": "continue"
// }


//     const postFidoresponse = await fetch(`${url}`, {
//       method: "POST",
//       // Add the Content-Type header
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify(postFido),
//     });

//     console.log('attestation response status:', postFidoresponse.status, postFidoresponse.statusText);

//     // If the response is not OK, throw an error to catch it below
//     if (!postFidoresponse.ok) {
//       throw new Error(`HTTP error! status: ${postFidoresponse.status}`);
//     }

//     const PostFidoresult = await postFidoresponse.text();
//     console.log('attestation raw response body:', PostFidoresult); // Log the raw body

//     // Parse the full JSON response
//     const postFidoresponseData = JSON.parse(PostFidoresult);
//     console.log(postFidoresponseData);


    const fidoChallenge = {
      id: responseData.id,
      fidoChallengeData: fidoChallengeData
    }

    return fidoChallenge;
    const pluginResponse = await FidoPluginPoc.register({
      credentialJson: fidoChallengeData,
    });
    console.log('result from plugin' + JSON.stringify(pluginResponse));
    console.log(pluginResponse);
  }

async getAuthId(): Promise<any>  {
    console.log('getAuthId called');


    const url = 'https://auth.pingone.com/18eba607-71f1-4365-b16a-4e2305a8798d/as/authorize?response_type=code&response_mode=pi.flow&scope=openid&client_id=7fbb3b2c-9758-4d2d-bd33-5e86bb8f0a4b';

    try {
      // The `await` keyword pauses execution until the fetch promise resolves.
      const response = await fetch(url);
      console.log('auth response from pingone');

      // The `response` object needs to be processed to get its body content.
      const textBody = await response.text();
      console.log(textBody);
      console.log('getting the auth id param')
      console.log(JSON.parse(textBody).id);
     const options =  await this.getAuthFidoChallenge(JSON.parse(textBody).id);
     console.log(options);
     return options
    } catch (error) {
      console.error('An error occurred:', error);
    }

  }
async getAuthFidoChallenge(id: string): Promise<any>  {
    const url = 'https://auth.pingone.com/18eba607-71f1-4365-b16a-4e2305a8798d/davinci/connections/481e952e6b11db8360587b8711620786/capabilities/customHTMLTemplate';
   
   const requestBody = {
    "id": id,
    "eventName": "continue",
    "parameters": {
        "eventType": "submit",
        "data": {
            "formData": {
                "username": "testuser-8-8-25"
            }
        }
    }
}

//     const requestBody = {
//   "id": id,
//   "nextEvent": {
//     "constructType": "skEvent",
//     "eventName": "continue",
//     "params": [],
//     "eventType": "post",
//     "postProcess": {}
//   },
//   "parameters": {
//     "username": "testuser-8-8-25",
//     "buttonType": "form-submit",
//     "buttonValue": "submit"
//   },
//   "eventName": "continue"
// }

    console.log('Fido challenge request body:', requestBody);

    const response = await fetch(`${url}`, {
      method: "POST",
      // Add the Content-Type header
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Fido challenge response status:', response.status, response.statusText);

    // If the response is not OK, throw an error to catch it below
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    console.log('fido challenge raw response body:', result); // Log the raw body

    // Parse the full JSON response
    const responseData = JSON.parse(result);

// Navigate the nested object to find the FIDO challenge
    const fidoChallengeData = responseData.screen.properties.fidoChallenge.value;

    console.log('The entire FIDO2 challenge object is:');
    console.log(JSON.stringify(fidoChallengeData));

    //base64 url encoded challengeme1z9OqpyDh-73hKzT_jW0tG_VokgIyfx2EsLG_adzI
    // base 64 url encoded user idHOjFLgmoUY_-38-Xa57oY8vXLE0L2hIIM18lLAmID6w

    const challengeBase64Url = this.toBase64Url(fidoChallengeData.challenge);
    fidoChallengeData.challenge = challengeBase64Url;
    console.log('base64 url encoded challenge'+challengeBase64Url)

    // 2. Convert the 'user.id' byte array to a Base64URL string
    if (fidoChallengeData.allowCredentials) {
      fidoChallengeData.allowCredentials = fidoChallengeData.allowCredentials.map((cred: { id: any; }) => ({
        ...cred,
        id: this.toBase64Url(cred.id as any)
      }));
    }
    // const userIdBase64Url = this.toBase64Url(fidoChallengeData.user.id);
    // console.log('base 64 url encoded user id'+userIdBase64Url);
    //fidoChallengeData.user.id = userIdBase64Url;
// Now you can access the individual WebAuthn properties
    console.log('The entire FIDO2 challenge updated object is:');
    console.log(JSON.stringify(fidoChallengeData));
    // const publicKeyCredentialRequestOptions =                              {
    //                          "challenge": fidoChallengeData.challenge,
    //                          "timeout":120000,
    //                          "rpId": responseData.screen.properties.rpid.value,
    //                          "allowCredentials":fidoChallengeData.excludeCredentials,
    //                          "userVerification":fidoChallengeData.authenticatorSelection.userVerification
    //           }

    //           console.log('auth request to be sent to capacitor plugin');
              //console.log(JSON.stringify(publicKeyCredentialRequestOptions));

               const assertion = await FidoPluginPoc.authenticate({
        publicKeyCredentialRequestOptions: fidoChallengeData,
      })
      console.log('assertion' + JSON.stringify(assertion));
      const asertionJson = JSON.parse(assertion.assertionJson);
      console.log('asertionJson' + JSON.stringify(asertionJson))
      //const parsedAssertion = JSON.parse()


      const assertionObject = {
      id: responseData.id,
      assertionData: asertionJson
    }
  
    return assertionObject;
    const pluginResponse = await FidoPluginPoc.register({
      credentialJson: fidoChallengeData,
    });
    console.log('result from plugin' + JSON.stringify(pluginResponse));
    console.log(pluginResponse);
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
