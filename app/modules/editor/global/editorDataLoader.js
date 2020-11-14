// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var ContentCollection = require('core/collections/contentCollection');
  var ContentModel = require('core/models/contentModel');
  var Origin = require('core/origin');
  
  var isLoaded;

  var Preloader = {
    /**
    * Loads course-specific data
    * Accepts callback for editor:refreshData
    */
    load: function(callback) {
      if(!Origin.sessionModel.get('isAuthenticated')) {
        return;
      }
      isLoaded = false;
      if(!Origin.editor) Origin.editor = {};
      if(!Origin.editor.data) Origin.editor.data = {};

      Origin.editor.data.content = new ContentCollection(undefined, { _courseId: Origin.location.route1 });
      Origin.editor.data.content.fetch({
       success: function(content) {
          isLoaded = true;

          Origin.editor.data.course = content.findWhere({ _type: 'course' });
          Origin.editor.data.config = content.findWhere({ _type: 'config' });

          if(!Origin.editor.data.course || !Origin.editor.data.config) {
            return handleError();
          }
          if(_.isFunction(callback)) {
            callback();
          }
          Origin.trigger('editor:dataLoaded');
        }, 
        error: handleError
      });
    },
    /**
    * Makes sure all data has been loaded and calls callback
    */
    waitForLoad: function(callback) {
      isLoaded ? callback.apply(this) : Origin.once('editor:dataLoaded', callback.bind(this));
    }
  };

  function handleError() {
    Origin.Notify.alert({ type: 'error', text: 'Failed to fetch course data' });
    Origin.router.navigateTo('dashboard');
  }
  
  return Preloader;
});
