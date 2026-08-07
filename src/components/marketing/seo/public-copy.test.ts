import { describe, expect, it } from "vitest";
import {
  guideCollections,
  guideDirectoryPages,
} from "@/components/marketing/guides/guide-directory";
import { guidePages } from "@/components/marketing/guides/guides-data";
import { seoPageList } from "./seo-pages-data";

const SEO_BRIEF_LANGUAGE = [
  /\bpillar\b/i,
  /supporting guide/i,
  /category page/i,
  /content cluster/i,
  /search engines?/i,
  /\bllms?\b/i,
  /should rank/i,
  /this page\b/i,
  /this page should/i,
  /this page exists/i,
  /commercial path/i,
  /\bpositioning\b/i,
  /users searching/i,
  /search visitors/i,
  /internal linking/i,
  /internally support/i,
  /what this page/i,
  /why this query/i,
] as const;

function visibleSeoCopy() {
  return seoPageList.map(
    ({ group: _group, groupLabel: _groupLabel, eyebrow: _eyebrow, keywords: _keywords, ...copy }) =>
      copy,
  );
}

describe("public marketing copy", () => {
  it("does not expose SEO brief language", () => {
    const copy = JSON.stringify({
      seoPages: visibleSeoCopy(),
      previewGuide: guidePages.modelPreviewInBrowser,
      directory: guideCollections,
    });

    for (const pattern of SEO_BRIEF_LANGUAGE) {
      expect(copy, `Found editorial language matching ${String(pattern)}`).not.toMatch(pattern);
    }
  });

  it("lists every canonical content page exactly once", () => {
    const directoryPaths = guideDirectoryPages.map((page) => page.path);
    const expectedPaths = [
      ...seoPageList.map((page) => page.path),
      guidePages.modelPreviewInBrowser.path,
    ];

    expect(new Set(directoryPaths).size).toBe(directoryPaths.length);
    expect([...directoryPaths].sort()).toEqual([...expectedPaths].sort());
    expect(directoryPaths).not.toContain("/organize-obj-files");
    expect(directoryPaths).toContain("/organize-obj-files-for-3d-printing");
  });
});
