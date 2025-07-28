package com.standard.fidopluginpoc;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;
import androidx.annotation.NonNull;

import androidx.credentials.Credential;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CredentialOption;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.GetPublicKeyCredentialOption;
import androidx.credentials.exceptions.GetCredentialException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import androidx.credentials.CredentialManager;
import androidx.credentials.CreateCredentialRequest;
import androidx.credentials.CreateCredentialResponse;
import androidx.credentials.exceptions.CreateCredentialException;
import androidx.credentials.CreatePublicKeyCredentialRequest;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "FidoPluginPoc")
public class FidoPluginPocPlugin extends Plugin {

    private CredentialManager credentialManager;
    private ExecutorService executorService = Executors.newSingleThreadExecutor();

    private FidoPluginPoc implementation = new FidoPluginPoc();

    @Override
  public void load() {
    super.load();
    Context context = getContext();
    credentialManager = CredentialManager.create(context);
  }

  @PluginMethod
  public void register(PluginCall call) {
    var data = call.getObject("credentialJson");
    if (data == null) {
      System.out.println("data");
      System.out.print(data);
      call.reject("Missing server data");
      return;
    }

    try {
      //JSONObject requestData = new JSONObject();
      //requestData.put("requestJson", data);
      CreateCredentialRequest createRequest =
        new CreatePublicKeyCredentialRequest(data.toString());
      credentialManager.createCredentialAsync(
        getActivity(),
        createRequest,
        null,
        executorService,
        new androidx.credentials.CredentialManagerCallback<CreateCredentialResponse, CreateCredentialException>() {
          @Override
          public void onResult(CreateCredentialResponse result) {
            try {
              String credentialJson = result.getData().getString("androidx.credentials.BUNDLE_KEY_REGISTRATION_RESPONSE_JSON");

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

  @PluginMethod
  public void authenticate(PluginCall call) {
    var data = call.getObject("publicKeyCredentialRequestOptions");
    if (data == null) {

      call.reject("Missing server data");
      return;
    }
    else {
        Log.d("FidoAuthPlugin", "Received data: " + data.toString());
    }

    try {
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
            if (credential == null) {
                call.reject("Credential is null");
                return;
            }
            Bundle bundle = credential.getData();
            if (bundle == null) {
                call.reject("Credential data bundle is null");
                return;
            }
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

    @PluginMethod
    public void echo(PluginCall call) {
        String value = call.getString("value");

        JSObject ret = new JSObject();
        ret.put("value", implementation.echo(value));
        call.resolve(ret);
    }
}
