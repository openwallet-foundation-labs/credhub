// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};
import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import 'jest-preset-angular/setup-jest';
