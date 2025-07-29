import { FidoPluginPoc } from 'fido-plugin-poc';

window.testEcho = () => {
    const inputValue = document.getElementById("echoInput").value;
    FidoPluginPoc.echo({ value: inputValue })
}
