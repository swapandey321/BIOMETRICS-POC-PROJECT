import Foundation
import Capacitor
import AuthenticationServices
import UIKit
import Security

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitorjs.com/docs/plugins/ios
 */
enum Attachment: String {
    case CROSSPLATFORM = "cross-platform"
    case PLATFORM = "platform"
}
// It's good practice to use unique identifiers for your Keychain items.
// This ensures your app's data doesn't conflict with other apps.
// We will use the username as the Keychain account, and a specific service name.
let kKeychainService = "com.standard.psc.app.FidoCredentials" // A unique service name for your credentials
// Using fixed account names for "global" storage, similar to SharedPreferences
let kUsernameAccount = "currentUserName"
let kCredentialIDAccount = "currentCredentialID"


@objc(FidoPluginPocPlugin)
public class FidoPluginPocPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {

    // MARK: - Properties

    private var currentCall: CAPPluginCall?
    private var currentAuthorizationController: ASAuthorizationController?
  
  

    public let identifier = "FidoPluginPocPlugin"
    public let jsName = "FidoPluginPoc"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "register", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "fetchSecureStorage", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isWebAuthnSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "secureStorage", returnType: CAPPluginReturnPromise)
    ]
    
    private let implementation = FidoPluginPoc() // Assuming FidoPluginPoc is defined elsewhere

    // MARK: - Plugin Methods

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve([
            "value": implementation.echo(value)
        ])
    }

    @objc func register(_ call: CAPPluginCall) {
       self.currentCall = call
           print("--- register method called inside plugin---") // Added print statement


             guard #available(iOS 15.0, *) else {
                 call.reject("Passkey registration requires iOS 15.0 or later.", "UNSUPPORTED_OS_VERSION")
                 return
             }

             guard let optionsJson = call.getObject("credentialJson") else {
                 call.reject("Missing credentialJson from JavaScript.")
                 return
             }
           print("Register: credentialJson received: \(optionsJson)") // Print the received JSON

             guard
                 let rpId = (optionsJson["rp"] as? JSObject)?["id"] as? String,
                 
                 let userIdBase64URL = (optionsJson["user"] as? JSObject)?["id"] as? String,
                 let userIdData = Data(base64Encoded: userIdBase64URL.base64URLtoBase64()),
                 let userDisplayName = (optionsJson["user"] as? JSObject)?["displayName"] as? String,
                 let challengeBase64URL = optionsJson["challenge"] as? String,
                 let challengeData = Data(base64Encoded: challengeBase64URL.base64URLtoBase64())
             else {
                 call.reject("Invalid or missing required credentialJson parameters (rp.id, user.id, user.name, challenge).")
                 return
             }
           let excludeList = (optionsJson["excludeCredentials"] as? [JSObject]) ?? []
     let excludedDescriptors = excludeList.compactMap { item -> ASAuthorizationPlatformPublicKeyCredentialDescriptor? in
         guard let idBase64URL = item["id"] as? String,
               let idData = Data(base64Encoded: idBase64URL.base64URLtoBase64()) else {
             return nil
         }
         return ASAuthorizationPlatformPublicKeyCredentialDescriptor(credentialID: idData)
     }

           print("Register: Parsed parameters:") // Print parsed parameters
               print("  rpId: \(rpId)")
               print("  userIdBase64URL: \(userIdBase64URL)")
               print("  userDisplayName: \(userDisplayName)")
               print("  challengeBase64URL: \(challengeBase64URL)")
           
           
             let platformProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: rpId)
             let registrationRequest = platformProvider.createCredentialRegistrationRequest(
                 challenge: challengeData,
                 name: userDisplayName,
                 userID: userIdData
             )
      if #available(iOS 17.4, *) {
        registrationRequest.excludedCredentials = excludedDescriptors
      } else {
        // Fallback on earlier versions
        print("excluded credentials were introduced in iOS 17.4")
      }


             let authorizationController = ASAuthorizationController(authorizationRequests: [registrationRequest])
             authorizationController.delegate = self
             authorizationController.presentationContextProvider = self
             self.currentAuthorizationController = authorizationController
             authorizationController.performRequests()
           print("Register: Performed authorization requests.")
    }

    @objc func authenticate(_ call: CAPPluginCall) {
        self.currentCall = call

        guard #available(iOS 15.0, *) else {
            call.reject("Passkey authentication requires iOS 15.0 or later.", "UNSUPPORTED_OS_VERSION")
            return
        }

        guard let optionsJson = call.getObject("publicKeyCredentialRequestOptions") else {
            call.reject("Missing publicKeyCredentialRequestOptions")
            return
        }

        guard
            let rpId = optionsJson["rpId"] as? String,
            let challengeBase64URL = optionsJson["challenge"] as? String,
            let challengeData = Data(base64Encoded: challengeBase64URL.base64URLtoBase64())
        else {
            call.reject("Invalid credentialRequestOptions format")
            return
        }

        let platformProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: rpId)
        let assertionRequest = platformProvider.createCredentialAssertionRequest(challenge: challengeData)

        let authorizationController = ASAuthorizationController(authorizationRequests: [assertionRequest])
        authorizationController.delegate = self
        authorizationController.presentationContextProvider = self
        self.currentAuthorizationController = authorizationController
        authorizationController.performRequests()
    }
  
  // MARK: - secureStorage (Stores username and credentialID in Keychain using fixed keys)
      @objc func secureStorage(_ call: CAPPluginCall) {
          let TAG = "FidoPluginPoc"
          
          guard let data = call.getObject("verificationJson") else {
              print("\(TAG) secureStorage: verificationJson is null")
              call.reject("Missing server data for secureStorage")
              return
          }
          
          print("\(TAG) secureStorage: Received verificationJson: \(data)")
          
          do {
              guard let username = data["userName"] as? String else {
                  call.reject("secureStorage: Missing 'userName' in verificationJson")
                  return
              }
              
              guard let credentialId = data["id"] as? String else {
                  call.reject("secureStorage: Missing 'id' (credentialId) in verificationJson")
                  return
              }
              
              // Store username and credentialId as separate Keychain items with fixed account names.
              // This replicates the SharedPreferences behavior of "last one wins".
              if let usernameData = username.data(using: .utf8) {
                  save(data: usernameData, service: kKeychainService, account: kUsernameAccount)
              } else {
                  print("\(TAG) secureStorage: Failed to convert username to Data.")
              }

              if let credentialIdData = credentialId.data(using: .utf8) {
                  save(data: credentialIdData, service: kKeychainService, account: kCredentialIDAccount)
              } else {
                  print("\(TAG) secureStorage: Failed to convert credentialId to Data.")
              }
              
              call.resolve(["success": true])
              
          } catch {
              call.reject("secureStorage failed: \(error.localizedDescription)")
          }
      }
      
      // MARK: - fetchSecureStorage (Retrieves username and credentialID from Keychain using fixed keys)
      @objc func fetchSecureStorage(_ call: CAPPluginCall) {
          let TAG = "FidoPluginPoc"
          print("\(TAG) fetchSecureStorage called")
          
          do {
              // Retrieve username and credential ID from their fixed Keychain accounts
              let storedUsernameData = retrieve(service: kKeychainService, account: kUsernameAccount)
              let storedCredentialIDData = retrieve(service: kKeychainService, account: kCredentialIDAccount)
              
              guard let usernameData = storedUsernameData,
                    let credentialIDData = storedCredentialIDData else {
                  call.reject("Credentials not found in secure storage.")
                  return
              }
              
              guard let storedUsername = String(data: usernameData, encoding: .utf8),
                    let storedCredentialID = String(data: credentialIDData, encoding: .utf8) else {
                  call.reject("Failed to decode stored credentials from secure storage.")
                  return
              }
              
              print("\(TAG) Found Credentials:")
              print("\(TAG) credentialID: \(storedCredentialID)")
              print("\(TAG) userName: \(storedUsername)")

              let jsResult: JSObject = [
                  "credentialID": storedCredentialID,
                  "userName": storedUsername
              ]
              
              var result = JSObject()
              result["response"] = jsResult
              result["success"] = true

              call.resolve(result)
              
          } catch {
              call.reject("fetchSecureStorage failed: \(error.localizedDescription)")
          }
      }

    
    // MARK: - ASAuthorizationControllerDelegate Methods

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
      print("authorizationController: didCompleteWithAuthorization")
        guard let currentCall = self.currentCall else {
            print("ASAuthorizationControllerDelegate: No active Capacitor call to resolve.")
            return
        }

        if #available(iOS 15.0, *) {
            if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialRegistration {
                handleRegistrationSuccess(credential: credential, call: currentCall)
            } else if let credential = authorization.credential as? ASAuthorizationSecurityKeyPublicKeyCredentialRegistration {
                 handleRegistrationSuccess(credential: credential, call: currentCall)
            } else if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion {
                handleAssertionSuccess(credential: credential, call: currentCall)
            } else if let credential = authorization.credential as? ASAuthorizationSecurityKeyPublicKeyCredentialAssertion {
                handleAssertionSuccess(credential: credential, call: currentCall)
            } else {
                currentCall.reject("Unknown credential type received from WebAuthn flow (iOS 15+).")
            }
        } else {
            currentCall.reject("Unsupported iOS version for this WebAuthn operation.", "UNSUPPORTED_OS_VERSION")
        }

        self.currentCall = nil
        self.currentAuthorizationController = nil
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
      print("authorizationController: didCompleteWithError")
        guard let currentCall = self.currentCall else {
            print("ASAuthorizationControllerDelegate: No active Capacitor call to reject due to error: \(error.localizedDescription)")
            return
        }

        if let authError = error as? ASAuthorizationError {
            switch authError.code {
            case .canceled:
              let jsResult: JSObject = [
                  "biometricAttemptsFailed": true,
              ]
              
              var result = JSObject()
              result["attestationJson"] = jsResult
              currentCall.resolve(result)
              // This is the most common error for user-initiated cancellation, including
                                          // if they fail the biometric prompt and then dismiss the dialog.
                //currentCall.reject("User canceled WebAuthn flow", "USER_CANCELED")
            case .invalidResponse:
                currentCall.reject("Invalid WebAuthn response from system", "INVALID_RESPONSE")
            case .notHandled:
                currentCall.reject("WebAuthn request not handled by system", "NOT_HANDLED")
            case .unknown:
                currentCall.reject("Unknown WebAuthn error", "UNKNOWN_ERROR")
            case .notInteractive:
                currentCall.reject("WebAuthn flow was not interactive", "NOT_INTERACTIVE")
            case .matchedExcludedCredential:
              let jsResult: JSObject = [
                  "alreadyRegistered": true,
              ]
              
              var result = JSObject()
              result["attestationJson"] = jsResult
              currentCall.resolve(result)

            default:
                currentCall.reject("An unexpected WebAuthn error occurred: \(authError.localizedDescription)", "UNEXPECTED_ERROR")
            }
        } else {
          print("error message printing ashutosh",error.localizedDescription)
          
          if error.localizedDescription.contains("At least one credential matches an entry of the excludeCredentials list") {
            let jsResult: JSObject = [
                "alreadyRegistered": true,
            ]
            
            var result = JSObject()
            result["attestationJson"] = jsResult
            currentCall.resolve(result)
                  } else {
                      // General fallback for all other unexpected errors
                      currentCall.reject("WebAuthn error: \(error.localizedDescription)", "WEB_AUTHN_ERROR")
                  }
        }

        self.currentCall = nil
        self.currentAuthorizationController = nil
    }


    
    // MARK: - ASAuthorizationControllerPresentationContextProviding

    // Ensure this method's signature exactly matches the protocol requirement.
    // It should be 'public func' and take 'for controller: ASAuthorizationController'.
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        // Find the key window to present the ASAuthorizationController UI
        guard let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) else {
            fatalError("No key window found for WebAuthn presentation.")
        }
        return window
    }

    
    // MARK: - Helper Methods

    @available(iOS 15.0, *)
    private func handleRegistrationSuccess(credential: ASAuthorizationPublicKeyCredentialRegistration, call: CAPPluginCall) {
      print("handleRegistrationSuccess called")
      print("Credential type: \(type(of: credential))") 
        do {
          // FIX: rawClientDataJSON is no longer optional in this context (iOS 15.0+).
                      let clientDataJSON = credential.rawClientDataJSON.base64EncodedString().base64ToBase64URL()
          print("handleRegistrationSuccess: clientDataJSON: \(clientDataJSON)") // Print clientDataJSON


            guard let attestationObjectData = credential.rawAttestationObject else {
                call.reject("Missing rawAttestationObject from registration credential.")
                return
            }
            let attestationObject = attestationObjectData.base64EncodedString().base64ToBase64URL()
          print("handleRegistrationSuccess: attestationObject: \(attestationObject)") // Print attestationObject
                    
            
            let credentialID = credential.credentialID.base64EncodedString().base64ToBase64URL()
          print("handleRegistrationSuccess: credentialID: \(credentialID)") // Print credentialID

          // --- ADDITION FOR TRANSPORTS ---
                      var transports: [String]?
                      // Cast to the concrete types to access 'supportedTransports'
          // Only attempt to get transports if it's a Security Key registration.
                      // ASAuthorizationPlatformPublicKeyCredentialRegistration does NOT have a 'transports' property.
                      if let securityKeyCredential = credential as? ASAuthorizationSecurityKeyPublicKeyCredentialRegistration {
                        if #available(iOS 17.5, *) {
                          transports = securityKeyCredential.transports.map { $0.rawValue }
                        } else {
                          // Fallback on earlier versions
                          transports = ["internal"]
                        }
                      }
          

            let credentialJson: [String: Any] = [
                "id": credentialID,
                "rawId": credentialID,
                "response": [
                    "clientDataJSON": clientDataJSON,
                    "attestationObject": attestationObject,
                    "transports": transports ?? []
                ],
                "type": "public-key"
            ]
          print("handleRegistrationSuccess: Attempting to resolve Capacitor call with response: \(credentialJson)") // Print final response
          
          // Convert the webAuthnResponse dictionary to JSON Data, then to a String.
                 let jsonResultData = try JSONSerialization.data(withJSONObject: credentialJson, options: [])
                 guard let jsonResultString = String(data: jsonResultData, encoding: .utf8) else {
                     call.reject("Failed to convert WebAuthn response data to string.")
                     return
                 }
          
            call.resolve(["credentialJson": jsonResultString])
        } catch {
            call.reject("Failed to encode WebAuthn registration response: \(error.localizedDescription)")
        }
    }
  
  @available(iOS 16.6, *)
  func getAuthenticatorAttachment(attachment: ASAuthorizationPublicKeyCredentialAttachment) -> String {
          var type = Attachment.PLATFORM.rawValue
          if attachment.rawValue == 1 {
              type = Attachment.CROSSPLATFORM.rawValue
          }
          return type
              
        }

    @available(iOS 15.0, *)
    private func handleAssertionSuccess(credential: ASAuthorizationPublicKeyCredentialAssertion, call: CAPPluginCall) {
      print("handleAssertionSuccess called")
      print("Credential type: \(type(of: credential))")
        do {
            // rawAuthenticatorData is non-optional
            let authenticatorData = credential.rawAuthenticatorData.base64EncodedString().base64ToBase64URL()
            
          // FIX: rawClientDataJSON is no longer optional in this context (iOS 15.0+).
          let clientDataJSON = credential.rawClientDataJSON.base64EncodedString().base64ToBase64URL()
          print("handleAssertionSuccess: clientDataJSON: \(clientDataJSON)") // Print clientDataJSON

            
            // signature is non-optional
            let signature = credential.signature.base64EncodedString().base64ToBase64URL()
          print("handleAssertionSuccess: signature: \(signature)") // Print clientDataJSON
          
            // credentialID is non-optional
            let credentialID = credential.credentialID.base64EncodedString().base64ToBase64URL()
          print("handleAssertionSuccess: credentialID: \(credentialID)") // Print clientDataJSON
            
            // userID is optional
            let userHandle = credential.userID?.base64EncodedString().base64ToBase64URL()
          print("handleAssertionSuccess: userHandle: \(userHandle ?? "nil")") // Print clientDataJSON
          
          var authenticatorAttachment: String?
          
                      
                      // Corrected logic for 'attachment' property (available from iOS 17.0 on specific types)
          if #available(iOS 16.6, *) {
                          if let platformCredential = credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion {
                              // FIX: Explicitly cast 'attachment' to its expected type, or
                              // better yet, just directly access the rawValue if it's there.
                              // The ambiguity can arise if 'attachment' itself is optional, and its rawValue could also be optional.
                              // Let's ensure we get a String? correctly.
                              authenticatorAttachment = getAuthenticatorAttachment(attachment: platformCredential.attachment)
                          }
                      } else {
                          if credential is ASAuthorizationPlatformPublicKeyCredentialAssertion {
                              authenticatorAttachment = "platform"
                          } else if credential is ASAuthorizationSecurityKeyPublicKeyCredentialAssertion {
                              authenticatorAttachment = "cross-platform"
                          }
                      }
                      // End of authenticatorAttachment logic
          print("handleAssertionSuccess: authenticatorAttachment: \(authenticatorAttachment ?? "nil")") // Print clientDataJSON
          
            let webAuthnResponse: [String: Any] = [
                "id": credentialID,
                "rawId": credentialID,
                "authenticatorAttachment": authenticatorAttachment as Any ,
                "response": [
                    "authenticatorData": authenticatorData,
                    "clientDataJSON": clientDataJSON,
                    "signature": signature,
                    "userHandle": userHandle ?? nil
                ],
                "type": "public-key"
            ]
          
          print("handleAssertionSuccess: Attempting to resolve Capacitor call with response: \(webAuthnResponse)") // Print final response
          
          // Convert the webAuthnResponse dictionary to JSON Data, then to a String.
                 let jsonResultData = try JSONSerialization.data(withJSONObject: webAuthnResponse, options: [])
                 guard let jsonResultString = String(data: jsonResultData, encoding: .utf8) else {
                     call.reject("Failed to convert WebAuthn response data to string.")
                     return
                 }
            call.resolve(["assertionJson": jsonResultString])
        } catch {
            call.reject("Failed to encode WebAuthn assertion response: \(error.localizedDescription)")
        }
    }
}

/// MARK: - Keychain Operations (Modified for fixed-key "global" storage)

/// Stores data associated with a specific service and account in the Keychain.
/// The 'account' parameter should be unique for each item you want to store (e.g., username).
private func save(data valueData: Data, service: String, account: String) {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecAttrAccount as String: account,
        kSecValueData as String: valueData,
        kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly // More restrictive access
    ]

    SecItemDelete(query as CFDictionary) // Delete any existing item first
    let status = SecItemAdd(query as CFDictionary, nil)

    if status == errSecSuccess {
        print("Successfully stored data for account '\(account)' in Keychain.")
    } else {
        print("Failed to store data for account '\(account)' in Keychain. Error: \(status)")
    }
}

/// Retrieves data for a given service and account from the Keychain.
/// - Parameter account: The unique identifier for the item (e.g., username).
/// - Returns: The retrieved Data, or nil if not found.
private func retrieve(service: String, account: String) -> Data? {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecAttrAccount as String: account,
        kSecReturnData as String: kCFBooleanTrue!,
        kSecMatchLimit as String: kSecMatchLimitOne
    ]

    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)

    if status == errSecSuccess {
        if let data = item as? Data {
            print("Successfully retrieved data for account '\(account)' from Keychain.")
            return data
        }
    } else if status == errSecItemNotFound {
        print("Data not found for account '\(account)' in Keychain.")
    } else {
        print("Failed to retrieve data for account '\(account)' from Keychain. Error: \(status)")
    }
    return nil
}

// MARK: - Helper Extensions for Base64URL Conversion

extension String {
    func base64URLtoBase64() -> String {
        var base64 = self
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        // Add padding if necessary
        if base64.count % 4 != 0 {
            base64.append(String(repeating: "=", count: 4 - base64.count % 4))
        }
        return base64
    }

    func base64ToBase64URL() -> String {
        var base64URL = self
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
        // Remove padding
        base64URL = base64URL.replacingOccurrences(of: "=", with: "")
        return base64URL
    }
}
