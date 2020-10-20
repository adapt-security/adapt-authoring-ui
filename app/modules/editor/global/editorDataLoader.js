// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('core/origin');

  var ClipboardModel = require('core/models/clipboardModel');
  var ConfigModel = require('core/models/configModel');
  var CourseAssetModel = require('core/models/courseAssetModel');
  var CourseModel = require('core/models/courseModel');

  var isLoading = false;
  // used to check what's loaded
  var courseData = {
    course: false,
    config: false
  };
  // Public API
  var preloader = {
    /**
    * Loads course-specific data
    * Accepts callback for editor:refreshData
    */
    load: function(callback) {
      if(isLoading || !Origin.sessionModel.get('isAuthenticated')) { // no point continuing if not logged in
        return;
      }
      isLoading = true;
      ensureEditorData();
      resetLoadStatus(courseData);
      var ed = Origin.editor.data;
      var courseId = Origin.location.route1;
      var isAlreadyLoaded = isAllDataLoaded(courseData) || (ed.course && ed.course.get('_id') === courseId);
      // if data's already been initialised, we can just fetch the latest
      if(!isAlreadyLoaded) {
        _.extend(Origin.editor.data, {
          course: new CourseModel({ _id: courseId }),
          config: new ConfigModel({ _courseId: courseId })
        });
      }
      // fetch all collections
      fetchEditorData(courseData, function(error) {
        if(_.isFunction(callback)) callback();
        if (error) {
          Origin.trigger('editor:failedToLoad');
        }
        loadingCourseData = false;
        Origin.trigger('editor:dataLoaded');
      });
    },
    /**
    * Deletes course-specific data
    */
    reset: function() {
      Origin.editor.data = _.omit(Origin.editor.data, Object.keys(courseData));
    },
    /**
    * Makes sure all data has been loaded and calls callback
    */
    waitForLoad: function(callback) {
      var removeEvents = function() {
        Origin.off({
          'editor:dataPreloaded': done,
          'editor:dataLoaded': done,
          'editor:failedToLoad': removeEvents
        });
      };
      var done = function() {
        if(isAllDataLoaded(courseData)) {
          removeEvents();
          callback.apply(this);
        }
      };
      // in case we've already loaded
      done();

      if(!isAllDataLoaded(courseData)) {
        Origin.on('editor:dataLoaded', done);
      }
      Origin.on('editor:failedToLoad', removeEvents);
    }
  };
  /**
  * Functions
  */
  function isAllDataLoaded(data) {
    if(!data) return false;
    return _.every(data, function(value, key) { return value; });
  }
  function resetLoadStatus(data) {
    _.each(data, function(value, key) { data[key] = false; });
  }
  /**
  * Makes sure the Origin editor objects exist
  */
  function ensureEditorData() {
    if(!Origin.editor) Origin.editor = {};
    if(!Origin.editor.data) Origin.editor.data = {};
  }
  /**
  * Fetches a group of editor collections (Origin.editor.data)
  * @param object whose keys are the key found on Origin.editor.data
  * and is used for progress checking
  */
  function fetchEditorData(data, callback) {
    for(var i = 0, count = Object.keys(data).length; i < count; i++) {
      var key = Object.keys(data)[i];
      Origin.editor.data[key].fetch({
        success: function(collection) {
          data[collection._type] = true;
          if(callback && isAllDataLoaded(data)) callback.apply(this);
        },
        error: function(error) {
          onFetchError();
          callback(error);
        }
      });
    }
  }
  /**
  * Event handlers
  */

  function onFetchError(model, response, options) {
    Origin.Notify.alert({
      type: 'error',
      text: Origin.l10n.t('app.errorgeneric')
    });
    Origin.router.navigateTo('dashboard');
  }
  /**
  * Export
  */
  return preloader;
});
