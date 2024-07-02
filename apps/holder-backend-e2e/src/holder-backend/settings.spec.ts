import { AxiosInstance } from 'axios';
import { getInstance } from '@credhub/testing';

describe('settings', () => {
  let axios: AxiosInstance;

  beforeAll(() => {
    axios = getInstance();
  });

  it('get settings', async () => {
    await axios.get('/settings').then(
      (settings) => {
        expect(settings.status).toBe(200);
        expect(settings.data).toEqual({ auto: false, darkTheme: false });
      },
      (error) => {
        console.error(error);
      }
    );
  });

  it('update settings', async () => {
    await axios.post('/settings', { auto: true, darkTheme: true });
    const settings = await axios.get('/settings');
    expect(settings.status).toBe(200);
    expect(settings.data).toEqual({ auto: true, darkTheme: true });
  });
});
