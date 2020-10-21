// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var ConfigModel = require('core/models/configModel');
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

      Origin.editor.data.course = new ContentModel({ _id: Origin.location.route1 });

      Origin.editor.data.course.fetch({
        success: function (course) {
          Origin.editor.data.content = new ContentCollection(undefined, { _courseId: course.get('_id') });
          Origin.editor.data.content.fetch({
           success: function(content) {
              isLoaded = true;
              Origin.editor.data.config = content.findWhere({ _type: 'config' });
              if(_.isFunction(callback)) callback();
              Origin.trigger('editor:dataLoaded');
            }, 
            error: handleError
          });
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
    Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errorgeneric') });
    Origin.router.navigateTo('dashboard');
  }
  
  return Preloader;
});
