import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { TabBar, type TabItem } from "../../../../src/components/tab-bar/tab-bar";

const tabs: TabItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "history", label: "History", icon: "history" },
  { id: "settings", label: "Settings", icon: "settings" },
];

describe("TabBar", () => {
  it("renders all tabs", () => {
    render(<TabBar tabs={tabs} current="home" onChange={() => {}} />);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("active tab has aria-selected true", () => {
    render(<TabBar tabs={tabs} current="home" onChange={() => {}} />);
    const homeTab = screen.getByText("Home").closest("button");
    expect(homeTab?.getAttribute("aria-selected")).toBe("true");
  });

  it("inactive tab has aria-selected false", () => {
    render(<TabBar tabs={tabs} current="home" onChange={() => {}} />);
    const historyTab = screen.getByText("History").closest("button");
    expect(historyTab?.getAttribute("aria-selected")).toBe("false");
  });

  it("calls onChange when tab clicked", () => {
    const onChange = vi.fn();
    render(<TabBar tabs={tabs} current="home" onChange={onChange} />);
    fireEvent.click(screen.getByText("History"));
    expect(onChange).toHaveBeenCalledWith("history");
  });

  it("renders tab labels", () => {
    render(<TabBar tabs={tabs} current="home" onChange={() => {}} />);
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("History")).toBeTruthy();
  });
});

describe("TabBar structure", () => {
  it("keeps the tablist role on a div, with no navigation tag", () => {
    render(<TabBar tabs={tabs} current="home" onChange={() => {}} />);
    expect(screen.getByRole("tablist").tagName).toBe("DIV");
  });
});
