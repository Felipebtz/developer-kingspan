import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  approvalErrorMessage,
  approvalsApi,
  isActionAllowed,
} from "../api/approvals";
import { ApiError, configureApiAuth } from "../api/http";

describe("approval API integration", () => {
  beforeEach(() => {
    configureApiAuth({ getToken: () => "jwt-aprovador" });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("loads the real approval inbox and preserves allowedActions", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [
            {
              id: 1,
              title: "Compra de equipamentos",
              category: "EQUIPMENT",
              totalAmount: 3000,
              createdAt: "2026-10-25T12:00:00Z",
              status: "PENDING_APPROVAL",
              lockVersion: 1,
              allowedActions: ["APPROVE", "REJECT", "REQUEST_CHANGES"],
            },
          ],
          number: 0,
          size: 50,
          totalElements: 1,
          totalPages: 1,
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await approvalsApi.list(0, 50);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8085/approvals/inbox?page=0&size=50",
      expect.objectContaining({ method: "GET" })
    );
    expect(isActionAllowed(result.data[0], "APPROVE")).toBe(true);
  });

  it("approves with the current lockVersion", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 204 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await approvalsApi.decide(1, "APPROVE", 7, "Aprovado");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8085/requests/1/approve",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ lockVersion: 7, comment: "Aprovado" }),
      })
    );
  });

  it("explains a concurrent approval conflict", () => {
    const message = approvalErrorMessage(
      new ApiError(409, "CONCURRENT_MODIFICATION", "Versão desatualizada.")
    );

    expect(message).toContain("Outra pessoa pode ter decidido antes");
  });
});
