import { join } from "node:path";
import type { Folder, File } from "../definitions.js";

/** Parse a multi-line indented string with emojis for files and folders into an FSD root. */
export function parseIntoFolder(fsMarkup: string): Folder {
  function parseFolder(lines: Array<string>, path: string): Folder {
    const children: Array<Folder | File> = [];

    lines.forEach((line, index) => {
      if (line.startsWith("📂 ")) {
        let nestedLines = lines.slice(index + 1);
        const nextIndex = nestedLines.findIndex(
          (line) => !line.startsWith("  "),
        );
        nestedLines = nestedLines.slice(
          0,
          nextIndex === -1 ? nestedLines.length : nextIndex,
        );
        const folder = parseFolder(
          nestedLines.map((line) => line.slice("  ".length)),
          join(path, line.slice("📂 ".length)),
        );
        children.push(folder);
      } else if (line.startsWith("📄 ")) {
        children.push({
          type: "file",
          path: join(path, line.slice("📄 ".length)),
        });
      }
    });

    return { type: "folder", path, children };
  }

  const lines = fsMarkup
    .split("\n")
    .filter(Boolean)
    .map((line, _i, lines) => line.slice(lines[0].search(/\S/)))
    .filter(Boolean);

  return parseFolder(lines, "/");
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("parseIntoFolder", () => {
    const root = parseIntoFolder(`
      📂 entities
        📂 users
          📂 ui
          📄 index.ts
        📂 posts
          📂 ui
          📄 index.ts
      📂 shared
        📂 ui
          📄 index.ts
          📄 Button.tsx
    `);

    expect(root).toEqual({
      type: "folder",
      path: "/",
      children: [
        {
          type: "folder",
          path: "/entities",
          children: [
            {
              type: "folder",
              path: "/entities/users",
              children: [
                {
                  type: "folder",
                  path: "/entities/users/ui",
                  children: [],
                },
                {
                  type: "file",
                  path: "/entities/users/index.ts",
                },
              ],
            },
            {
              type: "folder",
              path: "/entities/posts",
              children: [
                {
                  type: "folder",
                  path: "/entities/posts/ui",
                  children: [],
                },
                {
                  type: "file",
                  path: "/entities/posts/index.ts",
                },
              ],
            },
          ],
        },
        {
          type: "folder",
          path: "/shared",
          children: [
            {
              type: "folder",
              path: "/shared/ui",
              children: [
                {
                  type: "file",
                  path: "/shared/ui/index.ts",
                },
                {
                  type: "file",
                  path: "/shared/ui/Button.tsx",
                },
              ],
            },
          ],
        },
      ],
    });
  });
}
