// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var _ = require('underscore');
	var Backbone = require('backbone');
	var Origin = require('core/origin');
	var notifyAlert = require('./plugins/alert/index');
	var notifyConsole = require('./plugins/console/index');
	var notifySnackbar = require('./plugins/snackbar/index');
	var notifyToast = require('./plugins/toast/index');

	var Notify = Origin.Notify;

	if(!Notify) {
		Notify = Origin.Notify = _.extend({}, Backbone.Events);

		Notify.register = (name, func) => Notify[name] = func;
		
		loadPlugins();
	}

	function loadPlugins() {
		notifyAlert();
		notifyConsole();
		notifySnackbar();
		notifyToast();
	};

	return Notify;
});
