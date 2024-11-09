import {z} from "zod"

export const envSchema = z.object({
    PORT: z.number().default(3000),
    ETH_PRIVATE_KEY: z.string(),
    ETH_RPC_URL: z.string(),
    FUEL_PRIVATE_KEY: z.string(),
    FUEL_ENDPOINT: z.string()
});