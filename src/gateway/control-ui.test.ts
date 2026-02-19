import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { handleControlUiHttpRequest } from "./control-ui.js";

const makeResponse = (): {
  res: ServerResponse;
  setHeader: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
} => {
  const setHeader = vi.fn();
  const end = vi.fn();
  const res = {
    headersSent: false,
    statusCode: 200,
    setHeader,
    end,
  } as unknown as ServerResponse;
  return { res, setHeader, end };
};

describe("handleControlUiHttpRequest", () => {
  it("sets anti-clickjacking headers for Control UI responses", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-ui-"));
    try {
      await fs.writeFile(path.join(tmp, "index.html"), "<html></html>\n");
      const { res, setHeader } = makeResponse();
      const handled = handleControlUiHttpRequest(
        { url: "/", method: "GET" } as IncomingMessage,
        res,
        {
          root: { kind: "resolved", path: tmp },
        },
      );
      expect(handled).toBe(true);
      expect(setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
      expect(setHeader).toHaveBeenCalledWith("Content-Security-Policy", "frame-ancestors 'none'");
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });

  it("injects HolyOps CLI command and product brand in HolyOps mode", async () => {
    const prevCliName = process.env.OPENCLAW_CLI_NAME_OVERRIDE;
    process.env.OPENCLAW_CLI_NAME_OVERRIDE = "holyops";
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-ui-"));
    try {
      await fs.writeFile(path.join(tmp, "index.html"), "<html><head></head><body></body></html>\n");
      const { res, end } = makeResponse();
      const handled = handleControlUiHttpRequest(
        { url: "/", method: "GET" } as IncomingMessage,
        res,
        {
          root: { kind: "resolved", path: tmp },
        },
      );
      expect(handled).toBe(true);
      expect(end).toHaveBeenCalledTimes(1);
      const html = String(end.mock.calls[0]?.[0] ?? "");
      expect(html).toContain('window.__OPENCLAW_CLI_COMMAND__="holyops";');
      expect(html).toContain('window.__OPENCLAW_PRODUCT_BRAND__="HolyOps";');
    } finally {
      if (prevCliName === undefined) {
        delete process.env.OPENCLAW_CLI_NAME_OVERRIDE;
      } else {
        process.env.OPENCLAW_CLI_NAME_OVERRIDE = prevCliName;
      }
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});
