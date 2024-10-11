# `insignificant-slice`

It detects slices that have no references to suggest removing them, and also slices that have just one reference, to suggest merging it into the layer above. Note that pages are allowed to only have one reference, as they are the almost like entry points to the application.

Example of a project structure that passes this rule (arrows signify imports):

```mermaid
flowchart BT
  subgraph shared
    subgraph shared/ui[ui]
      shared/ui/styles.ts[styles.ts]
      shared/ui/Button.tsx[Button.tsx]
      shared/ui/TextField.tsx[TextField.tsx]
      shared/ui/index.ts[index.ts]
    end
  end

  subgraph pages
    subgraph pages/editor[editor]
      subgraph pages/editor/ui[ui]
        pages/editor/ui/EditorPage.tsx[EditorPage.tsx]
        pages/editor/ui/Editor.tsx[Editor.tsx]
      end
      pages/editor/index.ts[index.ts]
    end
  end

  shared/ui/Button.tsx --> shared/ui/styles.ts
  shared/ui/TextField.tsx --> shared/ui/styles.ts
  pages/editor/ui/Editor.tsx --> shared/ui/index.ts
  pages/editor/ui/EditorPage.tsx --> shared/ui/index.ts
  pages/editor/ui/EditorPage.tsx --> pages/editor/ui/Editor.tsx
```

Example of a project structure that fails this rule:

```mermaid
flowchart BT
  subgraph shared
    subgraph shared/ui[ui]
      shared/ui/styles.ts[styles.ts]
      shared/ui/Button.tsx[Button.tsx]
      shared/ui/TextField.tsx[TextField.tsx]
      shared/ui/index.ts[index.ts]
    end
  end

  subgraph entities
    subgraph entities/user["user (only one reference, @x doesn't count)"]
      subgraph entities/user/at-x[@x]
        entities/user/at-x/product.ts[product.ts]
      end
      subgraph entities/user/ui[ui]
        entities/user/ui/UserAvatar.tsx[UserAvatar.tsx]
      end
      entities/user/index.ts[index.ts]
    end

    subgraph entities/product["product (no references)"]
      subgraph entities/product/ui[ui]
        entities/product/ui/ProductCard.tsx[ProductCard.tsx]
      end
      entities/product/index.ts[index.ts]
    end
  end

  subgraph pages
    subgraph pages/editor[editor]
      subgraph pages/editor/ui[ui]
        pages/editor/ui/EditorPage.tsx[EditorPage.tsx]
        pages/editor/ui/Editor.tsx[Editor.tsx]
      end
      pages/editor/index.ts[index.ts]
    end
  end

  shared/ui/Button.tsx --> shared/ui/styles.ts
  shared/ui/TextField.tsx --> shared/ui/styles.ts
  entities/user/ui/UserAvatar.tsx --> shared/ui/index.ts
  entities/product/ui/ProductCard.tsx --> entities/user/at-x/product.ts
  pages/editor/ui/Editor.tsx --❗️--> entities/user/index.ts
  pages/editor/ui/EditorPage.tsx --> shared/ui/index.ts
  pages/editor/ui/EditorPage.tsx --> pages/editor/ui/Editor.tsx

  style entities/user fill:pink
  style entities/user/ui fill:pink
  style entities/user/at-x fill:pink
  style entities/product fill:pink
  style entities/product/ui fill:pink
```

## Rationale

Trying to decompose everything into as many layers and slices as possible leads to the logic spreading out needlessly, which negates the high cohesion benefit of Feature-Sliced Design. That's why if a slice is only used once, it's probably not worth having it as a separate slice.
