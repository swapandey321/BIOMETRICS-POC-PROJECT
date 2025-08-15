package com.standard.fidopluginpoc;

import androidx.annotation.RequiresApi;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;

import android.app.NotificationChannel;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CreateCredentialRequest;
import androidx.credentials.CreateCredentialResponse;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CredentialOption;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.GetPublicKeyCredentialOption;
import androidx.credentials.exceptions.CreateCredentialException;
import androidx.credentials.PublicKeyCredential;
import androidx.credentials.CreatePublicKeyCredentialRequest;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.GetCredentialUnsupportedException;
import androidx.credentials.exceptions.NoCredentialException;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "FidoPluginPoc")
public class FidoPluginPocPlugin extends Plugin {


    private CredentialManager credentialManager;
    private ExecutorService executorService = Executors.newSingleThreadExecutor();

    private FidoPluginPoc implementation = new FidoPluginPoc();

    public FidoPluginPocPlugin () {
    super();
  }

  @Override
  public void load() {
    super.load();
    Context context = getContext();
    credentialManager = CredentialManager.create(context);
  }

    @PluginMethod
    public void echo(PluginCall call) {
        String value = call.getString("value");

        JSObject ret = new JSObject();
        ret.put("value", implementation.echo(value));
        call.resolve(ret);
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
            Log.e("FidoAuthPlugin", "Biometric attempts failed", e);
            JSObject jsResult = new JSObject();
            jsResult.put("biometricAttemptsFailed",true);
            JSObject response = new JSObject();
            response.put("credentialJson",jsResult);
            call.resolve(response);
            //call.reject("Registration failed: " + e.getMessage());
          }
        }
      );
    } catch (Exception e) {
      call.reject("Error preparing credential request: " + e.getMessage());
    }
  }


  @PluginMethod
  public void secureStorage(PluginCall call)  {

    final String TAG = "FidoPluginPoc";

    var data = call.getObject("loginPreferenceJson");
    if (data == null) {
      Log.d(TAG,"data");
      Log.d(TAG, "loginPreferenceJson is null");

      call.reject("Missing loginPreferenceJson data");
      return;
    }
    try{
      Log.d(TAG, "Received loginPreferenceJson: " + data.toString());

      SharedPreferences preferences = getContext().getSharedPreferences("login_prefs", Context.MODE_PRIVATE);
      preferences.edit()
        .putString("useBiometrics", data.get("useBiometrics").toString())
        .putString("username", data.get("userName").toString())
        .apply();

      JSObject jsResult = new JSObject();
      jsResult.put("success", true);
      call.resolve(jsResult);
    }catch(JSONException jse){
      call.reject("Storage failed: " + jse.getMessage());
    }
  }

  @PluginMethod
  public void authenticate(PluginCall call) {
    var data = call.getObject("publicKeyCredentialRequestOptions");
    if (data == null) {

      call.reject("Missing server data");
      return;
    }else{Log.d("FidoAuthPlugin", "Received data: " + data.toString());}

    try {

      GetPublicKeyCredentialOption publicKeyOption =
  new GetPublicKeyCredentialOption(data.toString());
      List<CredentialOption> options = Arrays.asList(publicKeyOption);
      GetCredentialRequest credentialRequest = new GetCredentialRequest(options);

      Log.d("FidoAuthPlugin", "Preparing credential request...");

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
            Log.e("FidoAuthPlugin", "Biometric attempts failed", e);

            JSObject jsResult = new JSObject();
            jsResult.put("biometricAttemptsFailed",true);
            JSObject response = new JSObject();
            response.put("assertionJson",jsResult);
            call.resolve(response);

            //call.reject("Authentication failed: " + e.getMessage());
          }
        }
      );

    } catch (Exception e) {
      call.reject("Error preparing assertion request: " + e.getMessage());
    }
  }

  @PluginMethod
  public void fetchSecureStorage(PluginCall call)  {

    JSObject jsResult = new JSObject();
    try{

      SharedPreferences prefs = getContext().getSharedPreferences("login_prefs", Context.MODE_PRIVATE);

      if(prefs.contains("useBiometrics") && prefs.contains("username")){
        Log.d("FidoAuthPlugin", "Found loginPreference: " );
        var useBiometrics = prefs.getString("useBiometrics", null);
       
        var userName = prefs.getString("username", null);
        Log.d("FidoAuthPlugin", "userName: " + userName);
        jsResult.put("useBiometrics", useBiometrics);
        jsResult.put("userName", userName);

      }else{
        call.reject("Secure storage not found: ");
      }

      jsResult.put("success", true);

      JSObject result = new JSObject();
      result.put("response",jsResult);
      call.resolve(result);
    }catch(Exception jse){
      call.reject("Credentials not found: " + jse.getMessage());
    }

  }

  @PluginMethod
  @RequiresApi(api = Build.VERSION_CODES.TIRAMISU) // API 33+
  public void isWebAuthnSupported(PluginCall call) {

    GetPublicKeyCredentialOption option = new GetPublicKeyCredentialOption("{\"challenge\":\"dummy\"}");
    GetCredentialRequest request = new GetCredentialRequest(List.of(option));

    credentialManager.getCredentialAsync(
      getActivity(), // must be an Activity context
      request,
      null,
      executorService,
      new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
        @Override
        public void onResult(GetCredentialResponse getCredentialResponse) {
          Log.d("WebAuthnCheck", "CredentialManager is available");
          JSObject response = new JSObject();
          response.put("supported", true);
          JSObject result = new JSObject();
          result.put("response",response);
          call.resolve(result);
        }

        @Override
        public void onError(GetCredentialException e) {
          Log.e("WebAuthnCheck", "CredentialManager not available or failed", e);
          JSObject response = new JSObject();
          if (e instanceof GetCredentialUnsupportedException) {
          // Device does not support WebAuthn
            response.put("supported", false);

        }else if(e instanceof NoCredentialException){
            response.put("supported", true);

          }else{
            response.put("supported", false);
          }

          JSObject result = new JSObject();
           result.put("response",response);

          call.resolve(result);

        }
      }
    );
  }
}
