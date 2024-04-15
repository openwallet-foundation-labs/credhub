import axios, { type AxiosInstance } from 'axios';
import { v4 } from 'uuid';
import { beforeAll, describe, expect, it } from 'vitest';
import '../src/main';

type CreationResponse = {
  uri: string;
  userPinRequired: boolean;
  userPin?: string;
  pingLength?: number;
};

describe('main', () => {
  let instance: AxiosInstance;
  beforeAll(() => {
    instance = axios.create({
      baseURL: `http://localhost:${process.env.PORT ?? 3000}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should pass', async () => {
    const response = await instance
      .get('/.well-known/openid-credential-issuer')
      .then((response) => response.data);
    expect(response).toBeDefined();
  });

  it('create url', async () => {
    //TODO: define a type here.
    const body = {
      credentials: ['UniversityDegree_JWT'],
      grants: {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
          'pre-authorized_code': v4().substring(0, 10),
          user_pin_required: false,
        },
      },
      credentialDataSupplierInput: {
        credentialSubject: {},
      },
    };
    const response = await instance
      .post<CreationResponse>('/webapp/credential-offers', body)
      .then((response) => response.data);
    expect(response).toBeDefined();
    expect(response.uri).toBeDefined();
    console.log(response.uri);
  });
});
