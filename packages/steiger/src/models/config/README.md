# Config

The goal of this module is to parse the raw configuration, validate it and transform it to provide a way to access it in a form convenient for the application.

## Glossary

Configurations:

- **Raw configuration**: configuration obtained from a user-written configuration file.
- **Final configuration** (rule instructions): transformed configuration that is presented in a way to be used by the application.

There are 2 concepts of objects in the raw config.

- **Registration objects**: Plugin. Exists to register a plugin that contains rule implementations for the application to run.
- **Configuration objects**: ConfigObject, GlobalIgnore. Exists to configure the registered rules (what files to analyze, ignore, what options to pass to the rules).
