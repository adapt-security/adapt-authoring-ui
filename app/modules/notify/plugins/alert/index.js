// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var _ = require('underscore');
	var Origin = require('core/origin');
	var SweetAlert = require('./sweetalert2-11.1.7.all.min.js');

	function getSettings(data) {
		var defaults = {
			title: '',
			icon: data.type,
			allowOutsideClick: false
		};
		switch(data.type) {
			case 'confirm':
				data.type = null;
				delete defaults.icon;
				defaults.title = Origin.l10n.t('app.confirmdefaulttitle');
				break;
			case 'warning':
				defaults.title = Origin.l10n.t('app.warningdefaulttitle');
				break;
			case 'input':
				data.input = 'text';
				delete defaults.icon;
				break;
				case 'success':
					defaults.title = Origin.l10n.t('app.successdefaulttitle');
        break;
			case 'info':
				defaults.title = Origin.l10n.t('app.infodefaulttitle');
        break;
			case 'error':
				defaults.title = Origin.l10n.t('app.errordefaulttitle');
				break;
			default:
				if (data.type) {
					Origin.Notify.console({
						type: 'error',
						text: '"' + data.type + '" is not a valid alert type'
					});
				}
		}
		delete data.type;

		if(data.text) {
			data.html = data.text;
			delete data.text;
		}
		// combine settings, overwriting defaults with param
		return _.defaults(data, defaults);
	};

	function openPopup(data) {
		const cb = data.callback || function() {};
		delete data.callback;
		return SweetAlert.fire(getSettings(data)).then(cb);
	}

	var Alert = function(data) {
		// allow for string input
		if(_.isString(data)) {
			data = { title: data };
		}
		const returnData = { popup: openPopup(data) };
		returnData.SweetAlert = SweetAlert;
		return returnData;
	};
	/**
	 * NOTE if callback isn't an annonymous function, it won't be called on cancel
	 * See: https://github.com/t4t5/sweetalert/issues/431
	 */
	var Confirm = function(data) {
		// allow for string input
		if (_.isString(data)) {
			data = { html: data };
		}
		// some defaults, in the case of an additional type being passed
		var defaults = {
			type: data.type || 'confirm',
			showCancelButton: true,
			confirmButtonText: Origin.l10n.t('app.confirmdefaultyes'),
			cancelButtonText: Origin.l10n.t('app.no')
		};
		if(data.destructive === true) {
			let timerInterval;
			delete data.destructive;
			data.allowEnterKey = false;
			data.timer = 5000;
			data.timerProgressBar = true;
			data.didOpen = (el) => {
				$('.swal2-confirm', el).attr('disabled', true);
				timerInterval = setInterval(() => {
					if(SweetAlert.getTimerLeft() < 100) {
						SweetAlert.stopTimer();
						$('.swal2-timer-progress-bar-container').hide();
						$('.swal2-confirm', el).attr('disabled', false);
						clearInterval(timerInterval);
					}
				}, 100);
			};
			data.didClose = () => clearInterval(timerInterval);
		}
		openPopup(_.extend(defaults, data));
	};

	var init = function() {
		Origin.Notify.register('alert', Alert);
		Origin.Notify.register('confirm', Confirm);
		// shortcuts to override window methods
		window.alert = alert = Alert;
		window.confirm = confirm = Confirm;
		// add a global reference
		Origin.Notify.Swal = SweetAlert;
	};

	return init;
});
