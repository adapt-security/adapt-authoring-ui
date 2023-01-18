// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('core/origin');
  // are overridden by any values passed to Toast
  var defaults = {
    type: 'info',
    text: '',
    buttonText: Origin.l10n.t('app.close'),
    persist: false,
    timeout: 3000,
    callback: null
  };
  var $container;

  var Toast = function(data) {
    if(typeof data === 'string') {
      data = { text: data };
    }
    data = _.extend({}, defaults, data);
    appendToast(data);
  };

  function appendToast(data) {
    $container.removeClass('display-none');

    data.icon = "i";
    
    var $el = $(`<div class="${data.type} toast">`)
      .append($(`<div class="icon">${getIconHTML(data.type)}</div>`))
      .append($(`<div class="body">${data.text}</div>`));
    
    if(data.persist) {
      $el.append($('<button>', { 'class': 'close', text: data.buttonText }));
    } else {
      setTimeout(() => close(data, $el), data.timeout);
    }
    $el.on('click', () => close(data, $el))
    $el.appendTo($container);
    setTimeout(() => $el.addClass('visible'), 0);
  }
  function getIconHTML(type) {
    let iconName = '';
    switch(type) {
      case 'info': iconName = 'info-circle'; break; 
      case 'error': iconName = 'skull-crossbones'; break; 
      case 'warning': iconName = 'exclamation-triangle'; break; 
      case 'success': iconName = 'check-circle'; break; 
    }
    return `<i class="fa fa-${iconName}"></i>`;

  }

  function close(data, $el) {
    $el.removeClass('visible');
    setTimeout(() => {
      $el.remove();
      this.$el.addClass('display-none');
      if(data.callback) data.callback.apply();
    }, 500);
  };

  var init = function() {
    Origin.Notify.register('toast', Toast);

    Origin.on('origin:dataReady', function() {
      $container = $('<div class="toast-container display-none">');
      $('.app-inner').append($container);
    });
  };

  return init;

});
