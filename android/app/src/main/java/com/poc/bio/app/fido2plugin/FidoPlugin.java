package com.poc.bio.app.fido2plugin;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import androidx.credentials.CredentialManager;
import androidx.credentials.CreateCredentialRequest;
import androidx.credentials.CreateCredentialResponse;
import androidx.credentials.exceptions.CreateCredentialException;
import androidx.credentials.PublicKeyCredential;
//import androidx.credentials.PublicKeyCredentialCreationOptions;
import androidx.credentials.CreatePublicKeyCredentialRequest;

import org.json.JSONObject;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "FidoPlugin")
public class FidoPlugin extends Plugin {

  private CredentialManager credentialManager;
  private ExecutorService executorService = Executors.newSingleThreadExecutor();

  @Override
  public void load() {
    super.load();
    Context context = getContext();
    credentialManager = CredentialManager.create(context);
  }

  @PluginMethod
  public void register(PluginCall call) {
    String userId = call.getString("userId");
    if (userId == null) {
      call.reject("Missing userId");
      return;
    }

    try {
      // Simulate server-provided WebAuthn creation options as JSON
      JSONObject publicKeyJson = new JSONObject();
      publicKeyJson.put("rp", new JSONObject().put("name", "Example App").put("id", "example.com"));
      publicKeyJson.put("user", new JSONObject()
        .put("id", userId.getBytes())
        .put("name", userId)
        .put("displayName", userId));
      publicKeyJson.put("challenge", "SOME_RANDOM_CHALLENGE_STRING_BASE64");
      publicKeyJson.put("pubKeyCredParams", new org.json.JSONArray()
        .put(new JSONObject()
          .put("type", "public-key")
          .put("alg", -7))); // ES256

      CreatePublicKeyCredentialRequest request = new CreatePublicKeyCredentialRequest(
        publicKeyJson.toString()
      );

      credentialManager.createCredentialAsync(
        getActivity(),
        request,
        null,
        executorService,
        new androidx.credentials.CredentialManagerCallback<CreateCredentialResponse, CreateCredentialException>() {
          @Override
          public void onResult(CreateCredentialResponse result) {
            try {
              String credentialJson = result.getData().getString("androidx.credentials.BUNDLE_KEY_CREDENTIAL_JSON");

              if (credentialJson == null) {
                call.reject("Credential JSON is null");
                return;
              }

              JSObject jsResult = new JSObject();
              jsResult.put("credentialJson", credentialJson);
              call.resolve(jsResult);
            } catch (Exception e) {
              call.reject("Failed to extract credential: " + e.getMessage());
            }
          }

          @Override
          public void onError(@NonNull CreateCredentialException e) {
            call.reject("Registration failed: " + e.getMessage());
          }
        }
      );
    } catch (Exception e) {
      call.reject("Error preparing credential request: " + e.getMessage());
    }
  }
}
