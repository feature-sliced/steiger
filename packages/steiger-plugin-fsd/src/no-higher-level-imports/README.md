# `no-higher-level-imports`

This rule forbids imports from higher layers in the Feature-Sliced Design architecture. This is in accordance to the import rule on layers:

> A module in a slice can only import other slices when they are located on layers strictly below.
>
> https://feature-sliced.design/docs/reference/layers#import-rule-on-layers

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

  subgraph entities
    subgraph entities/user[user]
      subgraph entities/user/ui[ui]
        entities/user/ui/UserAvatar.tsx[UserAvatar.tsx]
      end
      entities/user/index.ts[index.ts]
    end
  end

  subgraph features
    subgraph features/auth[auth]
      subgraph features/auth/ui[ui]
        features/auth/ui/LoginForm.tsx[LoginForm.tsx]
      end
      features/auth/index.ts[index.ts]
    end
  end

  subgraph pages
    subgraph pages/editor[editor]
      subgraph pages/editor/ui[ui]
        pages/editor/ui/EditorPage.tsx[EditorPage.tsx]
      end
      pages/editor/index.ts[index.ts]
    end
  end

  shared/ui/Button.tsx --> shared/ui/styles.ts
  entities/user/ui/UserAvatar.tsx --> shared/ui/index.ts
  features/auth/ui/LoginForm.tsx --> shared/ui/index.ts
  features/auth/ui/LoginForm.tsx --> entities/user/index.ts
  pages/editor/ui/EditorPage.tsx --> shared/ui/index.ts
  pages/editor/ui/EditorPage.tsx --> entities/user/index.ts
  pages/editor/ui/EditorPage.tsx --> features/auth/index.ts
```

Examples of project structures that fail this rule:

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

  subgraph features
    subgraph features/comments[comments]
      subgraph features/comments/ui[ui]
        features/comments/ui/CommentCard.tsx[CommentCard.tsx]
      end
      features/comments/index.ts[index.ts]
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
  features/comments/ui/CommentCard.tsx --❌--> pages/editor/index.ts
  pages/editor/ui/Editor.tsx --> shared/ui/index.ts
  pages/editor/ui/EditorPage.tsx --> shared/ui/index.ts
```

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
    subgraph entities/cart[cart]
      subgraph entities/cart/ui[ui]
        entities/cart/ui/SmallCart.tsx[SmallCart.tsx]
      end
      entities/cart/index.ts[index.ts]
    end
  end

  subgraph app
    subgraph app/ui[ui]
      app/ui/index.ts[index.ts]
    end
    app/index.ts[index.ts]
    app/root.ts[root.ts]
  end

  shared/ui/Button.tsx --> shared/ui/styles.ts
  entities/cart/ui/SmallCart.tsx --❌--> app/index.ts
  app/ui/index.ts --> shared/ui/index.ts
```

## Rationale

This is one of the main rules of Feature-Sliced Design, it ensures low coupling and predictability in refactoring.
