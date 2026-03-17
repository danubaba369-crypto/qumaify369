import { createClient } from './supabase/client';

// Lazy initialization using a Proxy to prevent top-level createClient() 
// during build time when process.env is not yet available.
let instance: any = null;

export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (!instance) {
      instance = createClient();
    }
    return instance[prop];
  }
});
