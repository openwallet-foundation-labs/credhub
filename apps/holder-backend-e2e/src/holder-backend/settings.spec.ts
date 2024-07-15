import { HolderBackend } from '@credhub/testing';
import { AxiosInstance } from 'axios';

describe('settings', () => {
  let axios: AxiosInstance;
  const backend = globalThis.backend as HolderBackend;

  beforeAll(async () => {
    const username = globalThis.testUserEmail;
    const password = globalThis.testUserPassword;
    axios = await backend.getAxiosInstance(username, password);
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
