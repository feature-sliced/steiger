# `repetitive-naming`

Discourage repetitive parts in slice names (e.g. adding page to every slice on Pages).

Examples of project structures that pass this rule:

```
📂 pages
  📂 home
    📂 ui
    📄 index.ts
  📂 about
    📂 ui
    📄 index.ts
  📂 contact
    📂 ui
    📄 index.ts
```

Examples of project structures that fail this rule:

```
📂 pages
  📂 homePage  // ❌
    📂 ui
    📄 index.ts
  📂 aboutPage  // ❌
    📂 ui
    📄 index.ts
  📂 contactPage  // ❌
    📂 ui
    📄 index.ts
```

## Rationale

Suffixes that appear in the name every slice don't add much meaning and instead get in the way of understanding the difference between the slices.

## Auto-fixing

This rule can rename the slices for you, but only when the result is obvious. It offers a fix when the
repetitive word is the **last** word in every slice name, and takes that word out of each name while
keeping the casing and separators the author chose:

```
📂 pages          →   📂 pages
  📂 HomePage           📂 Home
  📂 about-page         📂 about
  📂 contact_page       📂 contact
```

Every reference to the renamed slices is updated along with them: static imports, `export ... from`,
dynamic `import()` and `require()`. References are found by parsing the source, so strings, comments and
route paths that happen to look like the old name are left alone.

No fix is offered, and the report stays as it is, when any of the following is true:

- the word isn't a suffix. Dropping `user` from `userLogin`, `userLogout` and `userProfile` would change
  what the slices are called, which is a decision for the author to make;
- the word appears more than once in a slice name (`homePagePage`), since cutting one occurrence would
  leave the report in place;
- removing the word would leave a slice without a name (a slice called just `page`);
- the new name is already taken by something else in the same layer or group, including when the two names
  differ only in case;
- the group has more than one repetitive word, so there's no telling which one is the redundant one;
- a reference to the slice can't be rewritten with certainty, because the specifier doesn't resolve or
  because it mentions the old slice name more than once.

Steiger only updates references inside the folder it was pointed at. If something outside of it, a build
config for instance, hardcodes a slice path, you have to update that by hand.
