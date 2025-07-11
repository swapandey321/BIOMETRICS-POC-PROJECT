package com.poc.bio.app.fido2plugin;

import android.content.Context;
import android.os.Bundle;

import androidx.annotation.NonNull;
import android.util.Log;

import androidx.credentials.CreateCredentialRequest;
import androidx.credentials.CreateCredentialResponse;
import androidx.credentials.CreatePublicKeyCredentialRequest;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CredentialOption;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.GetPublicKeyCredentialOption;
import androidx.credentials.exceptions.CreateCredentialException;
import androidx.credentials.exceptions.GetCredentialException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "FidoAuthPluginPoc")
public class FidoCapacitorAuthPlugin extends Plugin {

  private CredentialManager credentialManager;
  private ExecutorService executorService = Executors.newSingleThreadExecutor();

  public FidoCapacitorAuthPlugin(){
    super();
  }

  @Override
  public void load() {
    super.load();
    Context context = getContext();
    credentialManager = CredentialManager.create(context);
  }

  @PluginMethod
  public void register(PluginCall call) {
    var data = call.getObject("publicKeyCredentialRequestOptions");
    if (data == null) {

      call.reject("Missing server data");
      return;
    }else{Log.d("FidoAuthPlugin", "Received data: " + data.toString());}

    try {
      //JSONObject requestData = new JSONObject();
      //requestData.put("requestJson", data);
      GetPublicKeyCredentialOption publicKeyOption =
  new GetPublicKeyCredentialOption(data.toString());
      List<CredentialOption> options = Arrays.asList(publicKeyOption);
      GetCredentialRequest credentialRequest = new GetCredentialRequest(options);


      credentialManager.getCredentialAsync(
        getActivity(),
        credentialRequest,
        null,
        executorService,
        new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
          @Override
          public void onResult(GetCredentialResponse response) {
            Credential credential = response.getCredential();
            Bundle bundle = credential.getData();
            String assertionJson = bundle.getString("androidx.credentials.BUNDLE_KEY_AUTHENTICATION_RESPONSE_JSON");

            for (String key : bundle.keySet()) {
  Log.d("CredentialBundleKey", key + ": " + bundle.get(key));
}

            if (assertionJson == null) {
              call.reject("Assertion JSON is null");
              return;
            }

            JSObject jsResult = new JSObject();
            jsResult.put("assertionJson", assertionJson);
            call.resolve(jsResult);
          }

          @Override
          public void onError(@NonNull GetCredentialException e) {
            call.reject("Authentication failed: " + e.getMessage());
          }
        }
      );

    } catch (Exception e) {
      call.reject("Error preparing assertion request: " + e.getMessage());
    }
  }
}
