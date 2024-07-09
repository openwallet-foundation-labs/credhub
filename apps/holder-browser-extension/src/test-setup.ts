// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};
import { TextDecoder, TextEncoder } from 'util';

type Global = {
  TextDecoder: typeof TextDecoder;
};

global.TextEncoder = TextEncoder;
(global as Global).TextDecoder = TextDecoder;

import 'jest-preset-angular/setup-jest';
