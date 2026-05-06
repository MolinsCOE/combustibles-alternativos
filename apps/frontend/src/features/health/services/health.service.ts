import { httpClient, z, type RequestOptions } from "../../../shared/services/http-client.js";

const healthSchema = z.object({
  status: z.string()
});

export type HealthStatus = z.infer<typeof healthSchema>;

export const healthService = {
  fetchStatus(options?: RequestOptions): Promise<HealthStatus> {
    return httpClient.get("/api/health", healthSchema, options);
  }
};
