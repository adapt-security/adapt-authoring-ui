# Working with the UI

## Extending the UI

The UI can be extended easily from an Adapt authoring tool module.

### Register your plugin
Register your UI plugin by calling the [UIModule#addUiPlugin](https://tomtaylor.codes/ls/jsdoc3/UIModule.html#addUiPlugin) function from your own module's [init](https://tomtaylor.codes/ls/jsdoc3/AbstractModule.html#init) function, which ensures that your plugin code is included in the build of the front-end app.

Any files found in this folder will be included in the app build process, so make sure you include all front-end code, Handlebars templates and LESS/CSS in here.

### Define language strings
Add any translated language strings to the `/lang` folder in the root of your module

### Resources

- **GitHub template**: You can use the following GitHub template repository as a starting point: 
[adapt-security/adapt-authoring-uiplugintemplate](https://github.com/adapt-security/adapt-authoring-uiplugintemplate)

## Migrating from legacy

> During development, set `adapt-authoring-ui.isProduction` to `false` in your config file for easier debugging (all .js files are served directly, rather using than the minified adapt.js file)

### Changes

#### Permissions

The permissions mechanism has been completely rewritten to use permissions 'scopes' which are human-readable strings. Permissions utilities are now accessed directly from the SessionModel.

- `Origin.permissions.hasPermission` => `Origin.sessionModel.hasScopes`
- `hasPermission` => `ifHasScopes`

#### APIs

##### TODO

#### Language strings
Language strings are now served directly from the back-end server, and therefore need to be stored in the root `lang` folder of your authoring tool module. The server will need to be restarted for any changes to these to be recognised.