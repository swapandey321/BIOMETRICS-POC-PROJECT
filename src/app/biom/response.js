⚡️  [log] - registerWithBiometrics
⚡️  [log] - {}
⚡️  [log] - {"challenge":"lLUBAflcoWAN7bcZ1Fy2-n8gS2WqT5-Lg0jKF7aRldw","rp":{"name":"Biometric POC App","id":"175b2668e127.ngrok-free.app"},"user":{"id":"sAk4KO-IKSBZqHCsE1AQBA","name":"Test2@testing.com","displayName":"Test2@testing.com"},"pubKeyCredParams":[{"alg":-8,"type":"public-key"},{"alg":-7,"type":"public-key"},{"alg":-257,"type":"public-key"}],"timeout":60000,"attestation":"none","excludeCredentials":[],"authenticatorSelection":{"residentKey":"preferred","userVerification":"preferred","requireResidentKey":false},"extensions":{"credProps":true},"hints":[]}
⚡️  To Native ->  FidoPluginPoc register 70891121
--- register method called inside plugin---
Register: credentialJson received: ["excludeCredentials": [], "attestation": "none", "rp": ["id": "175b2668e127.ngrok-free.app", "name": "Biometric POC App"], "pubKeyCredParams": [["alg": -8, "type": "public-key"], ["alg": -7, "type": "public-key"], ["type": "public-key", "alg": -257]], "extensions": ["credProps": 1], "challenge": "lLUBAflcoWAN7bcZ1Fy2-n8gS2WqT5-Lg0jKF7aRldw", "hints": [], "user": ["id": "sAk4KO-IKSBZqHCsE1AQBA", "name": "Test2@testing.com", "displayName": "Test2@testing.com"], "timeout": 60000, "authenticatorSelection": ["residentKey": "preferred", "requireResidentKey": 0, "userVerification": "preferred"]]
Register: Parsed parameters:
  rpId: 175b2668e127.ngrok-free.app
userIdBase64URL: sAk4KO-IKSBZqHCsE1AQBA
userDisplayName: Test2@testing.com
challengeBase64URL: lLUBAflcoWAN7bcZ1Fy2-n8gS2WqT5-Lg0jKF7aRldw
Register: Performed authorization requests.
  authorizationController: didCompleteWithAuthorization
handleRegistrationSuccess called
handleRegistrationSuccess: clientDataJSON: eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoibExVQkFmbGNvV0FON2JjWjFGeTItbjhnUzJXcVQ1LUxnMGpLRjdhUmxkdyIsIm9yaWdpbiI6Imh0dHBzOi8vMDFlYmE2MmViOTNjLm5ncm9rLWZyZWUuYXBwIn0
handleRegistrationSuccess: attestationObject: o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYgpw5R3iC1XVi2WBN3D2643zRowbpJAbkUbd5vNhb5CZdAAAAAPv8MAcVTk7MjAtuAgVX170AFCEEfjDdf9c8iiyj8UocuSnvmIpupQECAyYgASFYILVpceD58givGab7Wen3gRHLF9_jgCwVg-7gcdLVDNH4Ilggs7J_Nmo-f4TCA5Vk6TEkMDFIJCj8MtucdxinbHefJMc
handleRegistrationSuccess: credentialID: IQR-MN1_1zyKLKPxShy5Ke-Yim4
handleRegistrationSuccess: Attempting to resolve Capacitor call with
  response: ["rawId": "IQR-MN1_1zyKLKPxShy5Ke-Yim4",
  "response": ["attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYgpw5R3iC1XVi2WBN3D2643zRowbpJAbkUbd5vNhb5CZdAAAAAPv8MAcVTk7MjAtuAgVX170AFCEEfjDdf9c8iiyj8UocuSnvmIpupQECAyYgASFYILVpceD58givGab7Wen3gRHLF9_jgCwVg-7gcdLVDNH4Ilggs7J_Nmo-f4TCA5Vk6TEkMDFIJCj8MtucdxinbHefJMc", "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoibExVQkFmbGNvV0FON2JjWjFGeTItbjhnUzJXcVQ1LUxnMGpLRjdhUmxkdyIsIm9yaWdpbiI6Imh0dHBzOi8vMDFlYmE2MmViOTNjLm5ncm9rLWZyZWUuYXBwIn0", "transports": []], "id": "IQR-MN1_1zyKLKPxShy5Ke-Yim4", "type": "public-key"]
⚡️  TO JS {"credentialJson":{"rawId":"IQR-MN1_1zyKLKPxShy5Ke-Yim4","response":{"attestationObject":"o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYgpw5R3iC1XVi2WBN3D2643zRowbpJAbkUbd5vNhb5CZdAAAAAPv8MAcVTk7MjAtuAgVX170AFCEEfjDdf9c8iiyj8UocuSnvmIpupQECAyYgASFYILVpceD58givGa
⚡️  [log] -
  result{"credentialJson":{"rawId":"IQR-MN1_1zyKLKPxShy5Ke-Yim4",
    "response":{"attestationObject":"o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYgpw5R3iC1XVi2WBN3D2643zRowbpJAbkUbd5vNhb5CZdAAAAAPv8MAcVTk7MjAtuAgVX170AFCEEfjDdf9c8iiyj8UocuSnvmIpupQECAyYgASFYILVpceD58givGab7Wen3gRHLF9_jgCwVg-7gcdLVDNH4Ilggs7J_Nmo-f4TCA5Vk6TEkMDFIJCj8MtucdxinbHefJMc",
    "clientDataJSON":"eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoibExVQkFmbGNvV0FON2JjWjFGeTItbjhnUzJXcVQ1LUxnMGpLRjdhUmxkdyIsIm9yaWdpbiI6Imh0dHBzOi8vMDFlYmE2MmViOTNjLm5ncm9rLWZyZWUuYXBwIn0",
    "transports":[]},
    "id":"IQR-MN1_1zyKLKPxShy5Ke-Yim4",
      "type":"public-key"}
}
⚡️  [log] - {"credentialJson":{"rawId":"IQR-MN1_1zyKLKPxShy5Ke-Yim4","response":{"attestationObject":"o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYgpw5R3iC1XVi2WBN3D2643zRowbpJAbkUbd5vNhb5CZdAAAAAPv8MAcVTk7MjAtuAgVX170AFCEEfjDdf9c8iiyj8UocuSnvmIpupQECAyYgASFYILVpceD58givGab7Wen3gRHLF9_jgCwVg-7gcdLVDNH4Ilggs7J_Nmo-f4TCA5Vk6TEkMDFIJCj8MtucdxinbHefJMc","clientDataJSON":"eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoibExVQkFmbGNvV0FON2JjWjFGeTItbjhnUzJXcVQ1LUxnMGpLRjdhUmxkdyIsIm9yaWdpbiI6Imh0dHBzOi8vMDFlYmE2MmViOTNjLm5ncm9rLWZyZWUuYXBwIn0","transports":[]},"id":"IQR-MN1_1zyKLKPxShy5Ke-Yim4","type":"public-key"}}
⚡️  [log] - errorJSON Parse error: Unexpected identifier "object"
⚡️  [log] - SyntaxError
