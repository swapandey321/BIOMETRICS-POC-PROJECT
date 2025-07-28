package com.poc.bio.app.fido2plugin;

import android.content.Context;
import android.os.Bundle;
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
import androidx.credentials.CreatePublicKeyCredentialRequest;

import org.json.JSONObject;

import java.util.Base64;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "FidoPluginPoc")
public class FidoPluginPoc extends Plugin {

  private CredentialManager credentialManager;
  private ExecutorService executorService = Executors.newSingleThreadExecutor();

  public FidoPluginPoc () {
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

  @Override
  protected void handleOnDestroy() {
    super.handleOnDestroy();
    if (executorService != null && !executorService.isShutdown()) {
      executorService.shutdown();
      try {
        // Wait a while for existing tasks to terminate
        if (!executorService.awaitTermination(5, java.util.concurrent.TimeUnit.SECONDS)) {
          // Cancel currently executing tasks and shutdown immediately
          executorService.shutdownNow();
        }
      } catch (InterruptedException e) {
        // Re-cancel if current thread was interrupted
        executorService.shutdownNow();
        // Preserve interrupt status
        Thread.currentThread().interrupt();
      }
    }
  }
}
