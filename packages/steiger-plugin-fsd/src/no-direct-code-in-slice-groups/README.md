# `no-direct-code-in-slice-groups`

Reports files and conventional segments placed directly inside a slice group.

A slice group exists only to organize related slices. It is not a slice itself, so it should not contain its own code, segments, or public API.

Examples of project structures that pass this rule:

```text
📂 shared
  📂 ui
    📄 index.ts
📂 features
  📂 post
    📂 compose
      📂 ui
      📄 index.ts
    📂 like
      📂 ui
      📄 index.ts
  📂 comment
    📂 model
    📂 ui
    📂 analytics
    📄 index.ts
📂 pages
  📂 home
    📂 ui
    📄 index.ts
```

Examples of project structures that fail this rule:

```text
📂 shared
  📂 ui
    📄 index.ts
📂 features
  📂 post
    📄 index.ts      // ❌
    📄 helpers.ts    // ❌
    📂 model         // ❌
    📂 @x            // ❌
    📂 compose
      📂 ui
      📄 index.ts
    📂 like
      📂 ui
      📄 index.ts
📂 pages
  📂 home
    📂 ui
    📄 index.ts
```

## Rationale

Code placed directly inside a slice group blurs the boundary between the group and the slices it contains.

Code should belong to one of the slices in the group, or be moved to an appropriate lower layer when it is shared between slices.

## How slice groups are detected

A slice group cannot always be distinguished from a slice by its folder structure alone.

For example, in the failing structure above, the misplaced `post/model` makes `post` look like a slice to `@feature-sliced/filesystem`.

For this reason, this rule uses a stricter, rule-local heuristic.

A folder is treated as a slice group when at least two of its direct subfolders look like slices or slice groups:

- a subfolder looks like a slice when it directly contains a conventional segment folder (`ui`, `model`, `api`, `lib`, or `config`);
- nested slice groups are detected recursively using the same criteria;
- folders named after conventional segments or `@x` do not count as slice or group candidates.

Once a slice group is detected, the rule reports its direct:

- files;
- conventional segment folders;
- `@x` folder.

Other folders are left alone because they may be slices without conventional segments. The rule does not search for slice groups inside a folder already identified as a slice.

## Known limitations

- **Groups with only one detectable slice are not detected.**

  ```text
  📂 features
    📂 post
      📂 model
      📂 compose
        📂 ui
  ```

  Here, `post` could be a slice group with a misplaced `model` segment or a slice with a custom `compose` segment, so the rule does not report it.

- **Slices with only file segments do not count as slice candidates.**

  Files such as `model.ts` or `config.ts` are not used as evidence that a folder is a slice. As a result, groups whose slices only use file segments may not be detected.

- **Custom segments containing conventional segment folders can be ambiguous.**

  ```text
  📂 features
    📂 post
      📄 index.ts
      📂 model
      📂 editor
        📂 ui
      📂 preview
        📂 ui
  ```

  If `editor` and `preview` are intended to be custom segments of the `post` slice, the rule may treat them as slices and report `index.ts` and `model`.

  [`no-reserved-folder-names`](../no-reserved-folder-names/README.md) also reports structures such as `editor/ui`, but this rule does not depend on it.

## Non-code files

The rule reports every file placed directly inside a detected slice group, regardless of its extension. This includes files such as `README.md` and `.gitkeep`.

This is consistent with other structural rules such as [`no-file-segments`](../no-file-segments/README.md).
