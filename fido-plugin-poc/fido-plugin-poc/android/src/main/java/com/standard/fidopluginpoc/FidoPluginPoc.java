package com.standard.fidopluginpoc;

import com.getcapacitor.Logger;

public class FidoPluginPoc {

    public String echo(String value) {
        Logger.info("Echo", value);
        return value;
    }
}
