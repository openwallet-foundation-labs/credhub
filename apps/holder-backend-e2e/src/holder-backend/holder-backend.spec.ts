import axios from 'axios';

describe('GET /health', () => {
  it('test if the service is healthy', async () => {
    const res = await axios.get(`/health`, { responseType: 'text' });
    expect(res.status).toBe(200);
    expect(res.data).toEqual('ok');
  });
});
