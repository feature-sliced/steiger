# `typo-in-layer-name`

Ensure that all layers are named consistently without any typos.

Examples of project structures that pass this rule:

```
📂 shared
📂 entities
📂 features
📂 widgets
📂 pages
📂 app
```

Examples of project structures that fail this rule:

```
📂 shraed  // ❌
📂 entities
📂 fietures  // ❌
📂 wigdets  // ❌
📂 page  // ❌
📂 app
```

## Rationale

The methodology contains a standardized set of layers. Enforcing these naming conventions is important for other developers, as well as for other rules of the linter to work correctly.
