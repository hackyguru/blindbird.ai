declare global {
  interface Window {
    electronAPI: {
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<boolean>;
      };
    };
    electronStore: {
      get: (key: string) => Promise<any>;
      set: (key: string, value: any) => Promise<void>;
    };
  }
} 