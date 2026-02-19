import { describe, expect, it } from "vitest";
import type { ChannelsStatusSnapshot } from "../types.ts";
import { resolveVisibleChannelOrder } from "./channels.ts";

function snapshotWithOrder(channelOrder: string[]): ChannelsStatusSnapshot {
  return {
    ts: Date.now(),
    channelOrder,
    channelLabels: {},
    channels: {},
    channelAccounts: {},
    channelDefaultAccountId: {},
  };
}

describe("resolveVisibleChannelOrder", () => {
  it("filters to v1 channels in HolyOps mode", () => {
    const order = resolveVisibleChannelOrder(
      snapshotWithOrder(["whatsapp", "telegram", "discord", "webchat"]),
      true,
    );
    expect(order).toEqual(["whatsapp", "webchat"]);
  });

  it("keeps full order outside HolyOps mode", () => {
    const order = resolveVisibleChannelOrder(
      snapshotWithOrder(["whatsapp", "telegram", "discord", "webchat"]),
      false,
    );
    expect(order).toEqual(["whatsapp", "telegram", "discord", "webchat"]);
  });
});
