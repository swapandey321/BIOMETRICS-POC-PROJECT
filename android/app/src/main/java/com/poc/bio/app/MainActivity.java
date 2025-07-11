package com.poc.bio.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.poc.bio.app.fido2plugin.*;


public class MainActivity extends BridgeActivity {
    @Override
  public void onCreate(Bundle savedInstanceState) {
      // Register your custom plugin here
      registerPlugin(FidoPluginPoc.class);
      registerPlugin(FidoCapacitorAuthPlugin.class);
      super.onCreate(savedInstanceState);

     // FidoPluginPoc fido = new FidoPluginPoc();

    // You no longer need to call this.init() with a list of plugins.
    // Capacitor automatically discovers plugins that are properly annotated
    // with @CapacitorPlugin and registered via registerPlugin().
  }
}
