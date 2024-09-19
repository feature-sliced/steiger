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

The methodology contains a standardized set of layers. By enforcing uniform naming conventions, this rule checks for any potential typos, improving the quality of projects.
