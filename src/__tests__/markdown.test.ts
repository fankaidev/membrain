import markdownit from "markdown-it";

describe("markdown test", () => {
  it("should render markdown to html", () => {
    const md = markdownit();
    const html = md.render("# Header");
    expect(html.trim()).toBe("<h1>Header</h1>");
  });
});
