export interface FidoPluginPocPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
  register(options: { credentialJson: any }): Promise<{ credentialJson: any }>;
  authenticate(options: { publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions }): Promise<{assertionJson: any}>;
}
