# Migrating from legacy

> During development, set `adapt-authoring-ui.isProduction` to `false` in your config file for easier debugging (all .js files are served directly, rather using than the minified adapt.js file)

## Changes

### Permissions

The permissions mechanism has been completely rewritten to use 'scopes', and is now accessed via the SessionModel.

- `Origin.permissions.hasPermission` -> `Origin.sessionModel.hasScopes`
- `hasPermission` -> `ifHasScopes`

### APIs

The APIs have been changed.

### Lang strings need moving to `/lang`
