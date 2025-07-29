import { registerPlugin } from '@capacitor/core';

import type { FidoPluginPocPlugin } from './definitions';

const FidoPluginPoc = registerPlugin<FidoPluginPocPlugin>('FidoPluginPoc', {
  web: () => import('./web').then((m) => new m.FidoPluginPocWeb()),
});

export * from './definitions';
export { FidoPluginPoc };
