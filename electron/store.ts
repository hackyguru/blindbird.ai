import Store from 'electron-store';
import { app } from 'electron';
import path from 'path';

const schema = {
  activeModels: {
    type: 'object',
    default: {}
  }
} as const;

export const store = new Store({
  schema,
  watch: true,
  cwd: path.join(app.getPath('userData'), 'blindbird-data'),
  name: 'config'
}); 