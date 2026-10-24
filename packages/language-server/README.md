# @feature-sliced/language-server

You probably don't need to use this package directly, just install editor extension instead :)

## Editors

### [VSCode](https://github.com/feature-sliced/steiger-vscode)

### Zed

Until there is a proper Zed extension, you can replace one of the existing language servers with this one. As a workaround, you can add the following to your `.zed/settings.json` file:

```json
{
  "lsp": {
    "tailwindcss-language-server": {
      "binary": {
        "path": "node_modules/@feature-sliced/language-server/bin/server.js"
      }
    }
  }
}
```
