# Migrating from legacy

> During development, set `adapt-authoring-ui.isProduction` to `false` in your config file for easier debugging (all .js files are served directly, rather using than the minified adapt.js file)

## Changes

### Permissions

The permissions mechanism has been completely rewritten to use permissions 'scopes' which are human-readable strings. Permissions utilities are now accessed directly from the SessionModel.

- `Origin.permissions.hasPermission` => `Origin.sessionModel.hasScopes`
- `hasPermission` => `ifHasScopes`

### APIs

#### TODO

### Language strings
Language strings are now served directly from the back-end server, and therefore need to be stored in the root `lang` folder of your authoring tool module. The server will need to be restarted for any changes to these to be recognised.
