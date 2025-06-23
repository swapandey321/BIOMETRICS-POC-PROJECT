export const registrationOptionData: any = {
  challenge: "ABCD34123265DEF34qwew4dgesfi", // to be base64url-encoded
  rp: {
    name: "My App",
    id: "fido.android.com"
  },
  user: {
    id: "alice@example.com:uuid-1234", // to be base64url(userId + deviceId)
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
    userVerification: "required", // forces biometric or PIN
    residentKey: 'required' 
  },
  // excludeCredentials: [
  //   {
  //     id: new TextEncoder().encode("previousCredentialIdInBase64Url"),
  //     type: "public-key"
  //   }
  // ],
  extensions: {
    appid: true,
    credProps: true // optional, for learning if it's discoverable
  }
};

export const authenticationOptionData: PublicKeyCredentialRequestOptions = {
  challenge: new TextEncoder().encode("Uej57FxBOo_Fxh7QwR34Ig"), // base64url
  timeout: 60000,
  rpId: "localhost", // optional if same as origin
  allowCredentials: [
    {
      type: "public-key",
      id: new TextEncoder().encode("Y3JlZGVudGlhbElkMTIz"), // base64url of previously registered credential ID
      transports: ["internal"] // optional, improves UX
    },
    {
      type: "public-key",
      id: new TextEncoder().encode("Y3JlZGVudGlhbElkMjM0"), // second credential (e.g., another device)
      transports: ["internal"]
    }
  ],
  userVerification: "required" // ask for biometric/passcode
}

