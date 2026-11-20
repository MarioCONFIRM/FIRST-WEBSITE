import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlaceholderPanel } from "@/components/ui/placeholder-panel";

describe("PlaceholderPanel", () => {
  it("clearly identifies a feature as not implemented", () => {
    render(
      <PlaceholderPanel
        area="customer"
        title="Transfers"
        description="Planned feature."
      />,
    );

    expect(screen.getByRole("heading", { name: "Transfers" })).toBeDefined();
    expect(screen.getByText(/not yet implemented/i)).toBeDefined();
    expect(
      screen.getByText(/no account creation, authentication, transactions/i),
    ).toBeDefined();
  });
});
