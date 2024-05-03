import './config.js';
import {
  PresentationDefinitionLocation,
  SupportedVersion,
} from '@sphereon/did-auth-siop';
import expressListRoutes from 'express-list-routes';
import { v4 } from 'uuid';
import { expressSupport } from './server.js';
import { RPManager } from './RPManager.js';
import { RequestBody } from './types.js';

// create the relying party manager
const rpManager = new RPManager();

//define the baseurl
const baseUrl = process.env.VERIFIER_BASE_URL || 'http://localhost:3000';

//add the endpoint to generate a request
expressSupport.express.post('/request', async (req, res) => {
  const body: RequestBody = req.body;
  // console.log(body);
  const instance = rpManager.getOrCreate(body.id);

  //TODO: we need a middleware to protect this route
  const correlationId = v4();
  const nonce = v4();
  const state = v4();
  //TODO: we need to add a parameter for the definition id, otherwhise the verifier is only able to handle one definition
  const requestByReferenceURI = `${baseUrl}/siop/${body.id}/auth-request/${correlationId}`;
  const responseURI = `${baseUrl}/siop/${body.id}/auth-response/${correlationId}`;
  const request = await instance.rp.createAuthorizationRequestURI({
    correlationId,
    nonce,
    state,
    version: SupportedVersion.SIOPv2_D12_OID4VP_D18,
    requestByReferenceURI,
    responseURI,
    responseURIType: 'response_uri',
  });
  res.send({
    uri: request.encodedUri,
  });
});

/**
 * Add the route to get the request object
 */
expressSupport.express.get(
  '/siop/:rp/auth-request/:correlationId',
  async (req, res) => {
    const rpId = req.params.rp;
    const instance = rpManager.getOrCreate(rpId);
    //normally we would use the definitionId to get the correct rp builder since there could be multiple
    const correlationId = req.params.correlationId;
    const request =
      await instance.rp.sessionManager.getRequestStateByCorrelationId(
        correlationId
      );
    res.send(await request?.request.requestObject?.toJwt());
  }
);

/**
 * Add the route to get the status of the request
 */
expressSupport.express.get(
  '/siop/:rp/auth-request/:correlationId/status',
  async (req, res) => {
    const rpId = req.params.rp;
    const instance = rpManager.getOrCreate(rpId);
    //normally we would use the definitionId to get the correct rp builder since there could be multiple
    const correlationId = req.params.correlationId;
    const request =
      await instance.rp.sessionManager.getRequestStateByCorrelationId(
        correlationId
      );
    if (!request) {
      res.status(404).send();
      return;
    }
    res.send({ status: request?.status });
  }
);
/**
 * Add the route to get the response object
 */
expressSupport.express.post(
  '/siop/:rp/auth-response/:correlationId',
  async (req, res) => {
    const rpId = req.params.rp;
    const instance = rpManager.getOrCreate(rpId);
    try {
      req.body.presentation_submission = JSON.parse(
        req.body.presentation_submission
      );
      const response = await instance.rp.verifyAuthorizationResponse(req.body, {
        correlationId: req.params.correlationId,
        //TODO: do we need it here when we added it in the constructor?
        presentationDefinitions: {
          definition: instance.verifier.request,
          location: PresentationDefinitionLocation.CLAIMS_VP_TOKEN,
        },
      });
      res.send({});
    } catch (e) {
      console.error(e);
      res.status(500).send((e as Error).message);
    }
  }
);

// only set this when reload is activated
if (process.env.CONFIG_RELOAD) {
  /**
   * This will remove a rp so it can be reloaded with new values
   */
  expressSupport.express.delete('/siop/:rp', async (req, res) => {
    const rpId = req.params.rp;
    await rpManager.remove(rpId, true);
    res.send();
  });
}

expressSupport.express.get('/health', async (req, res) => {
  res.send('ok');
});

//start the server
expressSupport.start();
console.log(`Running on port ${expressSupport.port}`);

//print the routes, only for debugging purposes
if (process.env.NODE_ENV === 'development') {
  expressListRoutes(expressSupport.express);
}
