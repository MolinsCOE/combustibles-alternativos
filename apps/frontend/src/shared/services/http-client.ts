import { z, type ZodSchema } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export type RequestOptions = {
  signal?: AbortSignal;
};

const errorBodySchema = z.object({
  code: z.string(),
  message: z.string()
});

async function readError(response: Response, path: string): Promise<HttpError> {
  try {
    const body: unknown = await response.json();
    const parsed = errorBodySchema.safeParse(body);
    if (parsed.success) {
      return new HttpError(response.status, parsed.data.message, parsed.data.code);
    }
  } catch {
    // fall through: body wasn't JSON
  }
  return new HttpError(
    response.status,
    `Request to ${path} failed with ${response.status}`
  );
}

async function request<T>(
  path: string,
  schema: ZodSchema<T>,
  init: RequestInit,
  options?: RequestOptions
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    signal: options?.signal,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    throw await readError(response, path);
  }

  const body: unknown = await response.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new Error(`Invalid response shape from ${path}: ${parsed.error.message}`);
  }
  return parsed.data;
}

async function requestVoid(
  path: string,
  init: RequestInit,
  options?: RequestOptions
): Promise<void> {
  const response = await fetch(path, {
    ...init,
    signal: options?.signal,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
  if (!response.ok) {
    throw await readError(response, path);
  }
}

export const httpClient = {
  get: <T>(path: string, schema: ZodSchema<T>, options?: RequestOptions) =>
    request(path, schema, { method: "GET" }, options),
  post: <T>(
    path: string,
    body: unknown,
    schema: ZodSchema<T>,
    options?: RequestOptions
  ) =>
    request(
      path,
      schema,
      { method: "POST", body: JSON.stringify(body) },
      options
    ),
  put: <T>(
    path: string,
    body: unknown,
    schema: ZodSchema<T>,
    options?: RequestOptions
  ) =>
    request(
      path,
      schema,
      { method: "PUT", body: JSON.stringify(body) },
      options
    ),
  delete: (path: string, options?: RequestOptions) =>
    requestVoid(path, { method: "DELETE" }, options)
};

export { z };
