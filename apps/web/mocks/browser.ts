import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

/*
  Worker MSW só é setado no browser. Em server components / build,
  este arquivo não deve ser importado direto — sempre passar por
  `./enable.ts`, que gate por `typeof window`.
*/
export const worker = setupWorker(...handlers);
