import {Component, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import FidoAuthPlugin from './plugins/fido-auth-plugin';
import {FidoService} from './fido.service';
import {FidoPluginPoc} from 'fido-plugin-poc';
import {App} from '@capacitor/app';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  title = 'biometrics-poc-project';

  constructor(private fidoService: FidoService) {
  }
  ngOnInit(){
    console.log('oninit called');
    //this.authenticateOnLaunch();
    // Listen for app resume
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('App resumed');
       // this.authenticateOnLaunch(); // Re-authenticate on resume
      }
    });

  }

  //call authenticate using biometric on app launch

  async authenticateOnLaunch(){
    const response = await FidoPluginPoc.fetchSecureStorage();
    console.log('response from fetch secure storage');
    console.log(JSON.stringify(response));
    console.log(response.response.userName);
    if(response.response.userName && response.response.credentialID){
      const options = await this.fidoService.getAuthenticationOptions(response.response.userName);
      console.log('authenticateWithBiometrics'+JSON.stringify(options));
      try{
//const assertion = await navigator.credentials.get({ publicKey: options });
        const assertion = await FidoPluginPoc.authenticate({
          publicKeyCredentialRequestOptions: options,
        });
        console.log('assertion'+JSON.stringify(assertion));
        const asertionJson = JSON.parse(assertion.assertionJson);
        console.log('asertionJson'+JSON.stringify(asertionJson))
        await this.fidoService.sendAuthenticationResult(asertionJson);
      }catch (err: any) {
        console.error("WebAuthn error:", err.name, err.message);
      }
    }

  }

}
