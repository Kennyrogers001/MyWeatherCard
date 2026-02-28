import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShareActions } from "@/components/share/ShareActions";

vi.mock("html-to-image", () => ({
  toBlob: vi.fn(async () => new Blob(["image"], { type: "image/png" }))
}));

describe("ShareActions", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:local-test");
    URL.revokeObjectURL = vi.fn();
    Object.defineProperty(navigator, "share", {
      configurable: true,
      writable: true,
      value: vi.fn()
    });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      writable: true,
      value: vi.fn(() => false)
    });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it("falls back to PNG download when native share is unavailable", async () => {
    const user = userEvent.setup();
    const captureRef = createRef<HTMLDivElement>();
    const captureElement = document.createElement("div");
    captureRef.current = captureElement;

    render(<ShareActions captureRef={captureRef} locationName="Kuala Lumpur" />);

    await user.click(screen.getByRole("button", { name: "Share" }));

    expect(
      await screen.findByText("Native share unavailable. PNG downloaded instead.")
    ).toBeInTheDocument();
  });
});
