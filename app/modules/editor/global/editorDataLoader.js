// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var ContentCollection = require('core/collections/contentCollection');
  var ContentPluginCollection = require('core/collections/contentPluginCollection');
  var Origin = require('core/origin');

  var isLoaded;

  var Preloader = {
    /**
    * Loads course-specific data
    * Accepts callback for editor:refreshData
    */
    load: async function(callback) {
      if(!Origin.sessionModel.get('isAuthenticated')) {
        return;
      }
      if(!Origin.editor) Origin.editor = {};
      if(!Origin.editor.data) Origin.editor.data = {};

      isLoaded = false;

      if(await isOutdated()) {
        try {
          await Promise.all([
            new Promise (async (resolve) => {
              const content = new ContentCollection(undefined, { _courseId: Origin.location.route1 });
              await content.fetch();
              Origin.editor.data.content = content;
              Origin.editor.data.course = content.findWhere({ _type: 'course' });
              Origin.editor.data.config = content.findWhere({ _type: 'config' });
              if(!Origin.editor.data.course || !Origin.editor.data.config) {
                return handleError();
              }
              resolve()
            }),
            new Promise (async (resolve) => {
              const componentTypes = new ContentPluginCollection(undefined, { type: 'component' });
              await componentTypes.fetch();
              Origin.editor.data.componentTypes = componentTypes;
              resolve()
            })
          ]);
        } catch(e) {
          return handleError();
        }
      }
      isLoaded = true;

      Origin.editor.data.lastFetch = new Date().toISOString();
      if(_.isFunction(callback)) {
        callback();
      }
      Origin.trigger('editor:dataLoaded');
    },
    resetCourseData: function() {
      if(Origin.editor) {
        Origin.editor.data.course = undefined;
        Origin.editor.data.config = undefined;
      }
    },
    /**
    * Makes sure all data has been loaded and calls callback
    */
    waitForLoad: function(callback) {
      isLoaded ? callback.apply(this) : Origin.once('editor:dataLoaded', callback.bind(this));
    }
  };

  async function isOutdated() {
    try {
      if(Origin.editor.data.course.get('_id') !== Origin.location.route1) {
        Origin.editor.data.lastFetch = 0
        return true;
      }
    } catch(e) {
      Origin.editor.data.lastFetch = 0
      return true;
    }
    const [latestDoc] = await $.post('/api/content/query?sort={%22updatedAt%22:-1}&limit=1', {_courseId:Origin.editor.data.course.get('_id')});
    return !latestDoc || new Date(Origin.editor.data.lastFetch) < new Date(latestDoc.updatedAt);
  }

  function handleError() {
    Origin.Notify.alert({ type: 'error', text: 'Failed to fetch course data' });
    Origin.router.navigateTo('projects');
  }

  return Preloader;
});
