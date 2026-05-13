/** @vitest-environment jsdom */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { Button } from "@/components/ui/button";


afterEach(() => {
  cleanup();
});


describe("Button", () => {
  it("renders a button with text", () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole("button").textContent).toBe("Click");
  });

  it("can be disabled", () => {
    render(<Button disabled>Click</Button>);
    const btn = screen.getByRole("button") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
