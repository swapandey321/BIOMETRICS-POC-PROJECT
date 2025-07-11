import { registerPlugin } from '@capacitor/core';

export interface FidoAuthPlugin {
  register(options: { publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions }): Promise<{assertionJson: any}>;
}

const FidoAuthPlugin = registerPlugin<FidoAuthPlugin>('FidoAuthPluginPoc');
export default FidoAuthPlugin