//
//  FidoPluginPocObjC.m
//  App
//
//  Created by Ashutosh Ray on 7/17/25.
//

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

//Register the swift class with capacitor
CAP_PLUGIN(FidoPluginPoc, "FidoPluginPoc", CAP_PLUGIN_METHOD(register, CAPPluginReturnPromise);
           )
