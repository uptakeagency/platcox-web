import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import WorldMap from "../WorldMap";
import { OFFICES } from "../../lib/offices";

describe("WorldMap", () => {
  it("her ofis için bir şehir etiketi çizer, fazlası yok", () => {
    render(<WorldMap />);
    for (const o of OFFICES) expect(screen.getByText(o.city)).toBeTruthy();
    // Eski örnek pinler (London, New York, Nairobi…) kalmadı.
    for (const ghost of ["London", "New York", "Nairobi", "Mumbai", "Shanghai"])
      expect(screen.queryByText(ghost)).toBeNull();
  });

  it("rotalar merkezden diğer her ofise çizilir", () => {
    const { container } = render(<WorldMap />);
    const routes = container.querySelectorAll("[data-motion-reduced-end-state]");
    expect(routes.length).toBe(OFFICES.length - 1);
  });
});
