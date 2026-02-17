import type { IncomingMessage, ServerResponse } from "node:http";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ResolvedGatewayAuth } from "./auth.js";

const { mockHandleSlackHttpRequest } = vi.hoisted(() => {
  return {
    mockHandleSlackHttpRequest: vi.fn(async (_req: IncomingMessage, res: ServerResponse) => {
      res.statusCode = 204;
      res.end("slack");
      return true;
    }),
  };
});

vi.mock("../slack/http/index.js", () => {
  return {
    handleSlackHttpRequest: mockHandleSlackHttpRequest,
  };
});

import { createGatewayHttpServer } from "./server-http.js";

function createRequest(path: string): IncomingMessage {
  return {
    method: "POST",
    url: path,
    headers: { host: "localhost:18789" },
    socket: { remoteAddress: "127.0.0.1" },
  } as IncomingMessage;
}

function createResponse(): {
  res: ServerResponse;
  getBody: () => string;
} {
  let body = "";
  const res = {
    headersSent: false,
    statusCode: 200,
    setHeader: () => undefined,
    end: (chunk?: unknown) => {
      if (typeof chunk === "string") {
        body = chunk;
        return;
      }
      if (chunk == null) {
        body = "";
        return;
      }
      body = JSON.stringify(chunk);
    },
  } as unknown as ServerResponse;

  return {
    res,
    getBody: () => body,
  };
}

async function dispatchRequest(
  server: ReturnType<typeof createGatewayHttpServer>,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  server.emit("request", req, res);
  await new Promise((resolve) => setImmediate(resolve));
}

describe("gateway HTTP Senior Mantis channel pruning", () => {
  const resolvedAuth: ResolvedGatewayAuth = {
    mode: "none",
    token: undefined,
    password: undefined,
    allowTailscale: false,
  };
  const originalCliName = process.env.OPENCLAW_CLI_NAME_OVERRIDE;

  beforeEach(() => {
    mockHandleSlackHttpRequest.mockClear();
  });

  afterEach(() => {
    if (originalCliName === undefined) {
      delete process.env.OPENCLAW_CLI_NAME_OVERRIDE;
    } else {
      process.env.OPENCLAW_CLI_NAME_OVERRIDE = originalCliName;
    }
  });

  test("skips Slack HTTP route handling in Senior Mantis mode", async () => {
    process.env.OPENCLAW_CLI_NAME_OVERRIDE = "seniormantis";

    const server = createGatewayHttpServer({
      canvasHost: null,
      clients: new Set(),
      controlUiEnabled: false,
      controlUiBasePath: "/__control__",
      openAiChatCompletionsEnabled: false,
      openResponsesEnabled: false,
      handleHooksRequest: async () => false,
      resolvedAuth,
    });

    const response = createResponse();
    await dispatchRequest(server, createRequest("/api/slack/events"), response.res);

    expect(mockHandleSlackHttpRequest).not.toHaveBeenCalled();
    expect(response.res.statusCode).toBe(404);
    expect(response.getBody()).toBe("Not Found");
  });

  test("keeps Slack HTTP route handling outside Senior Mantis mode", async () => {
    delete process.env.OPENCLAW_CLI_NAME_OVERRIDE;

    const server = createGatewayHttpServer({
      canvasHost: null,
      clients: new Set(),
      controlUiEnabled: false,
      controlUiBasePath: "/__control__",
      openAiChatCompletionsEnabled: false,
      openResponsesEnabled: false,
      handleHooksRequest: async () => false,
      resolvedAuth,
    });

    const response = createResponse();
    await dispatchRequest(server, createRequest("/api/slack/events"), response.res);

    expect(mockHandleSlackHttpRequest).toHaveBeenCalledTimes(1);
    expect(response.res.statusCode).toBe(204);
    expect(response.getBody()).toBe("slack");
  });
});
