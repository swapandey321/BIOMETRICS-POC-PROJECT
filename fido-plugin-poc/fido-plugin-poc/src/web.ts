import { WebPlugin } from '@capacitor/core';

import type { FidoPluginPocPlugin } from './definitions';


export class FidoPluginPocWeb extends WebPlugin implements FidoPluginPocPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }

  authenticate(options: { publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions }): Promise<{
    assertionJson: any
  }> {
    console.log('Authenticate called from web', options.publicKeyCredentialRequestOptions);
    return Promise.resolve({assertionJson: undefined});
  }

  register(options: { credentialJson: any }): Promise<{ credentialJson: any }> {
    console.log('Register called from web', options.credentialJson);
    return Promise.resolve({credentialJson: undefined});
  }

  fetchSecureStorage(): Promise<{ response: any }> {
    console.log('fetchSecureStorage called from web');
    return Promise.resolve({response: undefined});
  }

  secureStorage(options: { verificationJson: any }): Promise<{ response: any }> {
    console.log('Register called from web', options.verificationJson);
    return Promise.resolve({response: undefined});
  }

  isWebAuthnSupported(): Promise<{ response: any }> {
    console.log('isWebAuthnSupported called from web');
    return Promise.resolve({response: undefined});
  }
}
