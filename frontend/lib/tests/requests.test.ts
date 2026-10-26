import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { configureApiAuth } from "../api/http";
import { requestsApi } from "../api/requests";

describe("requests API ownership filter", () => {
  beforeEach(() => {
    configureApiAuth({ getToken: () => "jwt-aprovadora" });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("requests only resources owned by the authenticated user", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ content: [] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestsApi.list({ mine: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8085/requests?mine=true",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("loads the separate visibility listing without the ownership filter", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ content: [] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestsApi.list({ mine: false });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8085/requests",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("preserves the existing endpoint when options are omitted", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ content: [] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestsApi.list();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8085/requests",
      expect.objectContaining({ method: "GET" })
    );
  });
});
