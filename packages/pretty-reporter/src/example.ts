import { reportPretty } from './index.js'

reportPretty([
  { message: 'Folder name "lib" in "shared/ui" is reserved for segment names', ruleName: 'no-reserved-folder-names' },
  {
    message:
      'Layer "features" has 23 ungrouped slices, which is above the recommended threshold of 20. Consider grouping them or moving the code inside to the layer where it\'s used.',
    ruleName: 'excessive-slicing',
  },
  {
    ruleName: 'inconsistent-naming',
    message: 'Inconsistent pluralization on layer "entities". Prefer all singular names',
    fixes: [
      {
        type: 'rename',
        path: '/entities/comments',
        newName: 'comment',
      },
    ],
  },
  { message: 'Layer "shared" should not have an index file', ruleName: 'no-layer-public-api' },
  { message: 'Layer "pages" should not have an index file', ruleName: 'no-layer-public-api' },
])

// reportPretty([])
