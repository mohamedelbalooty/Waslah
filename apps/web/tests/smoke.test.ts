import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Page from "../app/page";

describe("GET / root page (contracts/health-endpoints.md)", () => {
  it("renders the Waslah marker string", () => {
    const html = renderToStaticMarkup(createElement(Page));

    expect(html).toContain("Waslah");
  });
});
