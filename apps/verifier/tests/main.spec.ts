import axios, { type AxiosInstance } from 'axios';
import { v4 } from 'uuid';
import { beforeAll, describe, expect, it } from 'vitest';
import '../src/main';
import { RequestBody } from '../src/types';

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
      baseURL: `http://localhost:${process.env.PORT ?? 3002}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('create url', async () => {
    //TODO: define a type here.
    const body: RequestBody = {
      id: 'eID',
    };
    const response = await instance
      .post<CreationResponse>('/request', body)
      .then((response) => response.data);
    expect(response).toBeDefined();
    expect(response.uri).toBeDefined();
    console.log(response.uri);
  });
});
