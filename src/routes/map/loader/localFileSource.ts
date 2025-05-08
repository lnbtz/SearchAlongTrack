import type { GpxSource } from './sourceloader';
import fileIcon from '$lib/images/folder.png';

export const localFileSource: GpxSource = {
    id: 'local',
    name: 'Local File',
    icon: fileIcon,
    load: async () => {
      // Dummy: actual loading will happen in the component via FileReader
      throw new Error('Not implemented outside UI');
    }
  };