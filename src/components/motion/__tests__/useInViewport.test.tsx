import { describe, it, expect, beforeEach } from "bun:test";
import { render, act } from "@testing-library/react";
import { useInViewport, __resetPoolsForTesting } from "../hooks/useInViewport";
import { mockIntersectionObserver } from "./helpers/mockIntersectionObserver";
import type { RefObject } from "react";

interface ProbeProps {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  onState?: (s: { ref: RefObject<HTMLElement | null>; isInView: boolean }) => void;
}

function Probe({ threshold = 0.2, rootMargin = "0px", once = false, onState }: ProbeProps) {
  const { ref, isInView } = useInViewport({ threshold, rootMargin, once });
  onState?.({ ref, isInView });
  return <div ref={ref as RefObject<HTMLDivElement | null>} data-testid="target" data-in={isInView ? "1" : "0"} />;
}

describe("useInViewport", () => {
  let mockIO: ReturnType<typeof mockIntersectionObserver>;

  beforeEach(() => {
    __resetPoolsForTesting();
    mockIO = mockIntersectionObserver();
  });

  it("returns isInView=false initially", () => {
    const { getByTestId } = render(<Probe threshold={0.2} />);
    expect(getByTestId("target").getAttribute("data-in")).toBe("0");
  });

  it("updates isInView=true on intersect", () => {
    const { getByTestId } = render(<Probe threshold={0.2} />);
    const el = getByTestId("target");
    act(() => {
      mockIO.trigger(true, el);
    });
    expect(el.getAttribute("data-in")).toBe("1");
  });

  it("pools observers by (threshold, rootMargin, root) tuple", () => {
    render(<Probe threshold={0.2} rootMargin="0px" />);
    render(<Probe threshold={0.2} rootMargin="0px" />);
    expect(mockIO.observe.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("disconnects on unmount when last consumer leaves a pool", () => {
    const { unmount } = render(<Probe threshold={0.2} />);
    unmount();
    expect(mockIO.disconnect.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
