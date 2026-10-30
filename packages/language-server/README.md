# @feature-sliced/language-server

You probably don't need to use this package directly, just install editor extension instead :)

## Editor extensions

### [VS Code](https://marketplace.visualstudio.com/items?itemName=feature-sliced.steiger-vscode)

### [VS Code-based editors](https://open-vsx.org/extension/feature-sliced/steiger-vscode)

### [JetBrains IDEs](https://plugins.jetbrains.com/plugin/35319-steiger)

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
