# Extending the UI
The UI can be extended easily from an Adapt authoring tool module.

## Register your plugin
Register your UI plugin by calling the [UIModule#addUiPlugin](https://tomtaylor.codes/ls/jsdoc3/UIModule.html#addUiPlugin) function from your own module's [init](https://tomtaylor.codes/ls/jsdoc3/AbstractModule.html#init) function, which ensures that your plugin code is included in the build of the front-end app.

Any files found in this folder will be included in the app build process, so make sure you include all front-end code, Handlebars templates and LESS/CSS in here.

## Define language strings
Add any translated language strings to the `/lang` folder in the root of your module

## Resources

- **GitHub template**: You can use the following GitHub template repository as a starting point: 
[adapt-security/adapt-authoring-uiplugintemplate](https://github.com/adapt-security/adapt-authoring-uiplugintemplate)