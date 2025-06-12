export const registrationOptionData: PublicKeyCredentialCreationOptions = {
  challenge: new TextEncoder().encode("7LCCBzLf_XTx27OTq1MdiQ").buffer, // base64url-encoded
  rp: {
    name: "My App",
    id: "myapp.com" // optional: defaults to current origin
  },
  user: {
    id: new TextEncoder().encode("YWxpY2VAZXhhbXBsZS5jb20yOnV1aWQtMTIzNDU=").buffer, // base64url(userId + deviceId)
    name: "alice@example.com:uuid-1234",
    displayName: "Alice's Pixel 7"
  },
  pubKeyCredParams: [
    { type: "public-key", alg: -7 },    // ES256 (most common)
    { type: "public-key", alg: -257 }   // RS256 (optional fallback)
  ],
  timeout: 60000,
  attestation: "direct", // or "none"
  authenticatorSelection: {
    authenticatorAttachment: "platform", // "cross-platform" for roaming keys like YubiKey
    userVerification: "required" // forces biometric or PIN
  },
  excludeCredentials: [
    {
      id: new TextEncoder().encode("previousCredentialIdInBase64Url").buffer,
      type: "public-key"
    }
  ],
  extensions: {
    credProps: true // optional, for learning if it's discoverable
  }
};

export const authenticationOptionData: PublicKeyCredentialRequestOptions = {
  challenge: new TextEncoder().encode("Uej57FxBOo_Fxh7QwR34Ig").buffer, // base64url
  timeout: 60000,
  rpId: "myapp.com", // optional if same as origin
  allowCredentials: [
    {
      type: "public-key",
      id: new TextEncoder().encode("Y3JlZGVudGlhbElkMTIz").buffer, // base64url of previously registered credential ID
      transports: ["internal"] // optional, improves UX
    },
    {
      type: "public-key",
      id: new TextEncoder().encode("Y3JlZGVudGlhbElkMjM0").buffer, // second credential (e.g., another device)
      transports: ["internal"]
    }
  ],
  userVerification: "required" // ask for biometric/passcode
}

