import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.number().default(3000),
  ETH_PRIVATE_KEY: z.string(),
  ETH_RPC_URL: z.string(),
  FUEL_PRIVATE_KEY: z.string(),
  FUEL_ENDPOINT: z.string(),
});

export const tokenMetaDataSchema = z.object({
  fuelIgnitionTokenAddress: z.string(),
  maxAmount: z.coerce.string(),
  totalLiquidity: z.coerce.string(),
  transactionTime: z.coerce.string(),
  lockExpiryTime: z.coerce.string(),
});

export const lpConfigSchema = z.record(
  z.string(),
  tokenMetaDataSchema.pick({
    fuelIgnitionTokenAddress: true,
    maxAmount: true,
  }),
);

// ---------------
// section for response schemas { useful fo testing, rather than just creating simple types }
// ---------------

// Record: <TokenAddress, TokenMetaData>
// TODO: might we can add stricter schema for token address?
export const metadataResponseSchema = z.record(z.string(), tokenMetaDataSchema);
