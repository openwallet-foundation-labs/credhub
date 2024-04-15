import {
  ExpressBuilder,
  ExpressCorsConfigurer,
} from '@sphereon/ssi-express-support';

// create the express server
const cors = new ExpressCorsConfigurer().allowOrigin('*');
export const expressSupport = ExpressBuilder.fromServerOpts({
  startListening: false,
  port: process.env.PORT ? Number.parseInt(process.env.PORT) : 3000,
  hostname: '0.0.0.0',
})
  .withCorsConfigurer(cors)
  .build({ startListening: false });
