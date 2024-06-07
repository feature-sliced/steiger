# `forbidden-imports`

This rule forbids imports from higher layers and cross-imports between slices on the same layer. This is in accordance to the import rule on layers:

> A module in a slice can only import other slices when they are located on layers strictly below.
> 
> https://feature-sliced.design/docs/reference/layers#import-rule-on-layers

Example of a project structure that passes this rule:

```mermaid
flowchart BT
  subgraph shared
    shared/ui[ui]
  end

  subgraph shared/ui[ui]
    shared/ui/styles.ts[styles.ts]
    shared/ui/Button.tsx[Button.tsx]
    shared/ui/TextField.tsx[TextField.tsx]
    shared/ui/index.ts[index.ts]
  end

  subgraph pages
    pages/editor[editor]
  end

  subgraph pages/editor[editor]
    pages/editor/ui[ui]
    pages/editor/index.ts[index.ts]
  end

  subgraph pages/editor/ui[ui]
    pages/editor/ui/EditorPage.tsx[EditorPage.tsx]
    pages/editor/ui/Editor.tsx[Editor.tsx]
  end

  shared/ui/Button.tsx --> shared/ui/styles.ts
  shared/ui/TextField.tsx --> shared/ui/styles.ts
  pages/editor/ui/Editor.tsx --> shared/ui/index.ts
  pages/editor/ui/EditorPage.tsx --> shared/ui/index.ts
  pages/editor/ui/EditorPage.tsx --> pages/editor/ui/Editor.tsx
```

Examples of project structures that fail this rule:

```mermaid
flowchart BT
  subgraph shared
    shared/ui[ui]
  end

  subgraph shared/ui[ui]
    shared/ui/styles.ts[styles.ts]
    shared/ui/Button.tsx[Button.tsx]
    shared/ui/TextField.tsx[TextField.tsx]
    shared/ui/index.ts[index.ts]
  end

  subgraph entities
    entities/user[user]
    entities/product[product]
  end

  subgraph entities/user[user]
    entities/user/ui[ui]
    entities/user/index.ts[index.ts]
  end

  subgraph entities/user/ui[ui]
    entities/user/ui/UserAvatar.tsx[UserAvatar.tsx]
  end

  subgraph entities/product[product]
    entities/product/ui[ui]
    entities/product/index.ts[index.ts]
  end

  subgraph entities/product/ui[ui]
    entities/product/ui/ProductCard.tsx[ProductCard.tsx]
  end

  subgraph pages
    pages/editor[editor]
  end

  subgraph pages/editor[editor]
    pages/editor/ui[ui]
    pages/editor/index.ts[index.ts]
  end

  subgraph pages/editor/ui[ui]
    pages/editor/ui/EditorPage.tsx[EditorPage.tsx]
    pages/editor/ui/Editor.tsx[Editor.tsx]
  end

  shared/ui/Button.tsx --> shared/ui/styles.ts
  shared/ui/TextField.tsx --> shared/ui/styles.ts
  entities/user/ui/UserAvatar.tsx --> shared/ui/index.ts
  entities/product/ui/ProductCard.tsx --❌--> entities/user/index.ts
  pages/editor/ui/Editor.tsx --> shared/ui/index.ts
  pages/editor/ui/EditorPage.tsx --> shared/ui/index.ts
  pages/editor/ui/EditorPage.tsx --> pages/editor/ui/Editor.tsx
```

```mermaid
flowchart BT
  subgraph shared
    shared/ui[ui]
  end

  subgraph shared/ui[ui]
    shared/ui/styles.ts[styles.ts]
    shared/ui/Button.tsx[Button.tsx]
    shared/ui/TextField.tsx[TextField.tsx]
    shared/ui/index.ts[index.ts]
  end

  subgraph features
    features/comments[comments]
  end

  subgraph features/comments[comments]
    features/comments/ui[ui]
    features/comments/index.ts[index.ts]
  end

  subgraph features/comments/ui[ui]
    features/comments/ui/CommentCard.tsx[CommentCard.tsx]
  end

  subgraph pages
    pages/editor[editor]
  end

  subgraph pages/editor[editor]
    pages/editor/ui[ui]
    pages/editor/index.ts[index.ts]
  end

  subgraph pages/editor/ui[ui]
    pages/editor/ui/EditorPage.tsx[EditorPage.tsx]
    pages/editor/ui/Editor.tsx[Editor.tsx]
  end

  shared/ui/Button.tsx --> shared/ui/styles.ts
  shared/ui/TextField.tsx --> shared/ui/styles.ts
  features/comments/ui/CommentCard.tsx --❌--> pages/editor/index.ts
  pages/editor/ui/Editor.tsx --> shared/ui/index.ts
  pages/editor/ui/EditorPage.tsx --> shared/ui/index.ts
  pages/editor/ui/EditorPage.tsx --> pages/editor/ui/Editor.tsx
```


## Rationale

This is one of the main rules of Feature-Sliced Design, it ensures low coupling and predictability in refactoring.
