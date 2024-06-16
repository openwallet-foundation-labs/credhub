import { AxiosInstance } from 'axios';
import { getInstance } from '../support/dependencies/requests';

describe('settings', () => {
  let axios: AxiosInstance;

  beforeAll(() => {
    axios = getInstance();
  });

  it('get settings', async () => {
    const settings = await axios.get('/settings');
    expect(settings.status).toBe(200);
    expect(settings.data).toEqual({ auto: false, darkTheme: false });
  });

  it('update settings', async () => {
    await axios.post('/settings', { auto: true, darkTheme: true });
    const settings = await axios.get('/settings');
    expect(settings.status).toBe(200);
    expect(settings.data).toEqual({ auto: true, darkTheme: true });
  });
});
