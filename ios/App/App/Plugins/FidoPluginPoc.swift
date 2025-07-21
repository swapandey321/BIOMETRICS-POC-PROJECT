//
//  FidoPluginPoc.swift
//  App
//
//  Created by Ashutosh Ray on 7/17/25.
//

import Foundation
import Capacitor

@objc(FidoPluginPoc)
public class FidoPluginPoc: CAPPlugin {
  @objc(register:)
  public func register(call: CAPPluginCall) {
    print("[FidoPluginPoc] register called with:", call.getObject("credentialJson") as Any);
    
    //extract the payload
    guard let payload = call.getObject("credentialJson") else {
      call.reject("Missing Server data")
      return
    }
    call.resolve([
      "credentialJson": payload
    ])
  }
  
  
}
