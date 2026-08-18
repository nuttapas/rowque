import type { Database } from './utils/database.types';

const testProfile: Database['public']['Tables']['profiles']['Insert'] = {
  id: '00000000-0000-0000-0000-000000000000',
  display_name: 'Test',
  role: 'player'
};

export default testProfile;
