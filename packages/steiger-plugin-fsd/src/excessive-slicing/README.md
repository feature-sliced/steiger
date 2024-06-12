# `excessive-slicing`

Forbid having too many ungrouped slices or too many slices in a group.

> [!NOTE]
> For now, the threshold has been set to 20 arbitrarily. If this rule is too strict or too lenient, please open an issue.

Example of a project structure that passes this rule:

```
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
📂 pages
  📂 home
    📂 ui
    📄 index.ts
```

(Cartoonish) Example of a project structure that fails this rule:

```
📂 shared
  📂 ui
    📄 index.ts
  📂 i18n
    📄 index.ts
📂 features // ❌
  📂 comments
  📂 posts
  📂 users
  📂 cars
  📂 alligators
  📂 whales
  📂 giraffes
  📂 buses
  📂 trains
  📂 planes
  📂 boats
  📂 submarines
  📂 helicopters
  📂 rockets
  📂 satellites
  📂 space-stations
  📂 planets
  📂 galaxies
  📂 universes
  📂 multiverses
  📂 metaverses
  📂 ai
  📂 bitcoin
```

## Rationale

Having too many slices in a group or too many ungrouped slices makes it harder to discover features in a project and promotes excessive decomposition.
