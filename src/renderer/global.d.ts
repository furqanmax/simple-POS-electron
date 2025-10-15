import type { IPCApi } from '../shared/types';

declare global {
  interface Window {
    posAPI: IPCApi;
  }
}

export {};
