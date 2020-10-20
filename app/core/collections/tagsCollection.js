// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var Backbone = require('backbone');
	return Backbone.Collection.extend({ url: 'api/tags' });
});