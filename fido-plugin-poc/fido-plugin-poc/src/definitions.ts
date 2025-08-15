export interface FidoPluginPocPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
  register(options: { credentialJson: any }): Promise<{ credentialJson: any }>;
  authenticate(options: { publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions }): Promise<{assertionJson: any}>;
  fetchSecureStorage(): Promise<{response: any}>;
  isWebAuthnSupported(): Promise<{response: any}>;
  secureStorage(options: {loginPreferenceJson: any}): Promise<{response: any}>

}
