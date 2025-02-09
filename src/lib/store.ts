import Store from 'electron-store';

// Configure the store schema
const schema = {
  activeModels: {
    type: 'object',
    default: {}
  }
} as const;

// Create store instance with configuration
export const store = new Store({
  schema,
  watch: true,
  // Required for use in the renderer process
  cwd: 'blindbird-data',
  name: 'config'
}); 