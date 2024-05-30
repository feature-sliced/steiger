import { test, expect } from "vitest";

import { getAllSlices, getSlices, type Folder } from "../index.js";
import { parseIntoFolder } from "./prepare-test.js";

test("getSlices", () => {
  const rootFolder = parseIntoFolder(`
    📂 entities
      📂 user
        📂 ui
        📄 index.ts
      📂 posts
        📂 ui
        📄 index.ts
    📂 features
      📂 comments
        📂 ui
        📄 index.ts
    📂 pages
      📂 editor
        📂 ui
      📂 settings
        📂 notifications
          📂 ui
          📄 index.ts
        📂 profile
          📂 ui
          📄 index.ts
  `);

  expect(getSlices(rootFolder.children[0] as Folder)).toEqual({
    user: (rootFolder.children[0] as Folder).children[0],
    posts: (rootFolder.children[0] as Folder).children[1],
  });
  expect(getSlices(rootFolder.children[1] as Folder)).toEqual({
    comments: (rootFolder.children[1] as Folder).children[0],
  });
  expect(getSlices(rootFolder.children[2] as Folder)).toEqual({
    editor: (rootFolder.children[2] as Folder).children[0],
    "settings/notifications": (
      (rootFolder.children[2] as Folder).children[1] as Folder
    ).children[0],
    "settings/profile": (
      (rootFolder.children[2] as Folder).children[1] as Folder
    ).children[1],
  });
});

test("getAllSlices", () => {
  const rootFolder = parseIntoFolder(`
    📂 shared
      📂 ui
        📄 index.ts
      📂 i18n
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
        📂 model
        📄 index.ts
    📂 features
      📂 comments
        📂 ui
        📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
  `);

  const allSlices = getAllSlices(rootFolder);
  expect(Object.keys(allSlices).sort((a, b) => a.localeCompare(b))).toEqual([
    "comments",
    "home",
    "user",
  ]);

  expect(allSlices.user).toEqual({
    ...(rootFolder.children[1] as Folder).children[0],
    layerName: "entities",
  });
  expect(allSlices.comments).toEqual({
    ...(rootFolder.children[2] as Folder).children[0],
    layerName: "features",
  });
  expect(allSlices.home).toEqual({
    ...(rootFolder.children[3] as Folder).children[0],
    layerName: "pages",
  });
});
