// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('core/origin');

  // are overridden by any values passed to Snackbar
  var defaults = {
    type: 'info',
    text: '',
    persist: true,
    timeout: 3000,
    callback: null
  };
  var $el;
  var queue = [];

  var Snackbar = function(data) {
    if(typeof data === 'string') {
      data = { text: data };
    }
    queue.push(_.extend({},defaults,data));
    if(queue.length === 1) processQueue();
  };

  function processQueue() {
    var data = queue[0];
    
    $('.body', $el).html(data.text);
    $el.attr({ class: data.type });

    $('.close', $el).toggle(data.persist);
    if(!data.persist) setTimeout(close, data.timeout);

    $el.removeClass('display-none').addClass('visible');
  };
  
  function close() {
    $el.removeClass('visible');
    setTimeout(() => {
      $el.addClass('display-none');
      data = queue.shift();
      if(data.callback) data.callback.apply();
    }, 500);
  };

  Snackbar.close = function() {
    const data = queue[0];
    if(data) delete data.callback // force close shouldn't execute callback
    close()
  };
  
  var init = function() {
    Origin.Notify.register('snackbar', Snackbar);
    Origin.on('origin:dataReady', function() {
      $el = $(`
        <div id="snackbar" class="display-none">
          <div class="body"></div>
          <a href="#" class="close">${Origin.l10n.t('app.close')}</a>
        </div>
      `);
      $('.app-inner').append($el);
      $el.on('click', close);
      $('.close', $el).on('click', e => e.preventDefault());
    });
  };

  return init;
});
