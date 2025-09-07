// Supabase configuration
// These values will be provided by the Figma Make environment
let projectId = 'default-project-id';
let publicAnonKey = 'default-anon-key';

try {
  // Try different ways to access environment variables
  if (typeof globalThis !== 'undefined') {
    const env = (globalThis as any).ENV || (globalThis as any);
    projectId = env.SUPABASE_PROJECT_ID || projectId;
    publicAnonKey = env.SUPABASE_ANON_KEY || publicAnonKey;
  }
  
  // Try import.meta.env if available
  if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
    const metaEnv = (window as any).import.meta.env;
    projectId = metaEnv.VITE_SUPABASE_PROJECT_ID || projectId;
    publicAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || publicAnonKey;
  }
  
  // Try process.env if available
  if (typeof process !== 'undefined' && process.env) {
    projectId = process.env.REACT_APP_SUPABASE_PROJECT_ID || projectId;
    publicAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || publicAnonKey;
  }
} catch (error) {
  console.log('Using default Supabase configuration');
}

export { projectId, publicAnonKey };