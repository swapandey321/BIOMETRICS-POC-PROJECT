package com.standard.fidopluginpoc;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.naming.Context;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

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

            call.reject("Registration failed: " + e.getMessage());
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

    var data = call.getObject("verificationJson");
    if (data == null) {
      Log.d(TAG,"data");
      Log.d(TAG, "verificationJson is null");

      call.reject("Missing server data");
      return;
    }
    try{
      Log.d(TAG, "Received verificationJson: " + data.toString());

      SharedPreferences preferences = getContext().getSharedPreferences("webauthn_prefs", Context.MODE_PRIVATE);
      preferences.edit()
        .putString("username", data.get("userName").toString())
        .putString("credentialId", data.get("id").toString())
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

  @PluginMethod
  public void fetchSecureStorage(PluginCall call)  {

    JSObject jsResult = new JSObject();
    try{

      SharedPreferences prefs = getContext().getSharedPreferences("webauthn_prefs", Context.MODE_PRIVATE);

      if(prefs.contains("username") && prefs.contains("credentialId")){
        Log.d("FidoAuthPlugin", "Found Credentials: " );
        var credentialID = prefs.getString("credentialId", null);
        Log.d("FidoAuthPlugin", "credentialIDn: " + credentialID);
        var userName = prefs.getString("username", null);
        Log.d("FidoAuthPlugin", "userName: " + userName);
        jsResult.put("credentialID", credentialID);
        jsResult.put("userName", userName);

      }else{
        call.reject("Credentials not found: ");
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
        public void onResult(GetCredentialResponse result) {
          Log.d("WebAuthnCheck", "CredentialManager is available");
          JSObject response = new JSObject();
          response.put("supported", true);
          call.resolve(response);
        }

        @Override
        public void onError(GetCredentialException e) {
          Log.e("WebAuthnCheck", "CredentialManager not available or failed", e);
          JSObject response = new JSObject();
          response.put("supported", false);
          call.resolve(response);
        }
      }
    );
  }
}
