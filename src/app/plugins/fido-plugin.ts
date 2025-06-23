import { registerPlugin } from '@capacitor/core';

export interface FidoPlugin {
  register(options: { credentialJson: any }): Promise<{ credentialJson: any }>;
}

const Fido = registerPlugin<FidoPlugin>('FidoPluginPoc');
export default Fido