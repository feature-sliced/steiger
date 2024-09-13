import { reportPretty } from '../src/index.js'

function getRuleDescriptionUrl(ruleName: string) {
  return new URL(`https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd/src/${ruleName}`)
}

reportPretty(
  [
    {
      message: 'Inconsistent pluralization of slice names. Prefer all plural names',
      ruleName: 'inconsistent-naming',
      fixes: [
        {
          type: 'rename',
          path: '/home/user/project/src/entities/user',
          newName: 'users',
        },
      ],
      location: { path: '/home/user/project/src/entities', type: 'folder' },
      severity: 'error',
      getRuleDescriptionUrl,
    },
    {
      message: 'This slice has no references. Consider removing it.',
      ruleName: 'insignificant-slice',
      location: { path: '/home/user/project/src/entities/users', type: 'folder' },
      severity: 'error',
      getRuleDescriptionUrl,
    },
    {
      message: 'This slice has no references. Consider removing it.',
      ruleName: 'insignificant-slice',
      location: { path: '/home/user/project/src/entities/user', type: 'folder' },
      severity: 'error',
      getRuleDescriptionUrl,
    },
    {
      message:
        'Having a folder with the name "api" inside a segment could be confusing because that name is commonly used for segments. Consider renaming it.',
      ruleName: 'no-reserved-folder-names',
      location: { path: '/home/user/project/src/entities/user/ui/api', type: 'folder' },
      severity: 'warn',
      getRuleDescriptionUrl,
    },
    {
      message: 'This slice has no segments. Consider dividing the code inside into segments.',
      ruleName: 'no-segmentless-slices',
      location: { path: '/home/user/project/src/pages/home', type: 'folder' },
      severity: 'error',
      getRuleDescriptionUrl,
    },
    {
      message: 'Layer "processes" is deprecated, avoid using it',
      ruleName: 'no-processes',
      location: { path: '/home/user/project/src/processes', type: 'folder' },
      severity: 'error',
      getRuleDescriptionUrl,
    },
  ],
  '/home/user/project',
)

// reportPretty([], '/home/user/project')
