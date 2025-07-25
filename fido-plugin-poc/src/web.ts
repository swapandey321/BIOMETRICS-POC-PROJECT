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
}
