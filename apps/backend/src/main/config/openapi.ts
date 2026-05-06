type OpenApiResponse = {
  description: string;
  content: {
    "application/json": {
      schema: {
        type: string;
        properties?: Record<string, { type: string; example?: string }>;
        required?: string[];
      };
    };
  };
};

type OpenApiPathItem = {
  get?: {
    summary: string;
    tags: string[];
    responses: Record<string, OpenApiResponse>;
  };
};

type OpenApiDocument = {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string }>;
  tags: Array<{ name: string; description: string }>;
  paths: Record<string, OpenApiPathItem>;
};

export const openApiDocument: OpenApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "AI Base App API",
    version: "1.0.0",
    description: "API documentation for the backend service.",
  },
  servers: [{ url: "/" }],
  tags: [{ name: "Health", description: "Health and readiness endpoints" }],
  paths: {
    "/health": {
      get: {
        summary: "Service health check",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                  },
                  required: ["status"],
                },
              },
            },
          },
        },
      },
    },
  },
};

export function getSwaggerUiHtml(specUrl: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>API Docs</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css"
    />
    <style>
      body { margin: 0; background: #fafafa; }
      #swagger-ui { max-width: 1100px; margin: 0 auto; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    </script>
  </body>
</html>`;
}
