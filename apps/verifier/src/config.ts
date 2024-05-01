import Joi from 'joi';
import 'dotenv/config';

/**
 * Define the environment variables schema
 */
const envVarsSchema = Joi.object()
  .keys({
    PORT: Joi.number().default(3000),
    CONFIG_RELOAD: Joi.boolean().default(false),
    VERIFIER_BASE_URL: Joi.string().required(),
    NODE_ENVIRONMENT: Joi.string()
      .valid('development', 'production')
      .default('development'),
  })
  .unknown();

const { error, value: envVars } = envVarsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}
