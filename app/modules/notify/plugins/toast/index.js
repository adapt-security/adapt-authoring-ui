// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('core/origin');
  // these are overridden by any values passed to Toast
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
    if(typeof data === 'string') data = { text: data };
    appendToast(Object.assign({}, defaults, { text: data.html, icon: getIcon(data.type) }, data));
  };
  
  function appendToast(data) {
    $container.removeClass('display-none');
    
    const $el = $(Handlebars.templates.toast(data));
    $el.close = () => close(data, $el);
    $el.appendTo($container);
    setTimeout(() => $el.addClass('visible'), 1);

    if(data.persist) {
      $('button.close', $el).on('click', $el.close);
    } else {
      $el.on('click', $el.close);
      setTimeout($el.close, data.timeout);
    }
  }
  function getIcon(type) {
    switch(type) {
      case 'info': return 'info-circle';
      case 'error': return 'exclamation-circle';
      case 'warning': return 'exclamation-triangle';
      case 'success': return 'check-circle';
    }
  }
  
  function close(data, $el) {
    $el.removeClass('visible');
    setTimeout(() => {
      $el.remove();
      $container.addClass('display-none');
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
  