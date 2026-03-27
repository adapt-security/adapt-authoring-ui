// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function (require) {
  var _ = require('underscore')
  var Backbone = require('backbone')
  var ContentModel = require('core/models/contentModel')
  var ContentPluginCollection = require('core/collections/contentPluginCollection')
  var Origin = require('core/origin')

  var isLoaded
  var lastModified

  var Preloader = {
    /**
    * Loads course-specific data
    * Accepts callback for editor:refreshData
    */
    load: async function (callback) {
      if (!Origin.sessionModel.get('isAuthenticated')) {
        return
      }
      if (!Origin.editor) Origin.editor = {}
      if (!Origin.editor.data) Origin.editor.data = {}

      isLoaded = false

      try {
        var treeData = await isOutdated()
        if (treeData) {
          await Promise.all([
            loadTree(treeData),
            loadComponentTypes()
          ])
        }
      } catch (e) {
        return handleError()
      }
      isLoaded = true

      if (_.isFunction(callback)) {
        callback()
      }
      Origin.trigger('editor:dataLoaded')
    },
    resetCourseData: function () {
      if (Origin.editor) {
        Origin.editor.data.course = undefined
        Origin.editor.data.config = undefined
      }
      lastModified = undefined
    },
    /**
    * Makes sure all data has been loaded and calls callback
    */
    waitForLoad: function (callback) {
      isLoaded ? callback.apply(this) : Origin.once('editor:dataLoaded', callback.bind(this))
    }
  }

  async function loadTree (treeData) {
    var items, resLastModified
    if (treeData.items) {
      items = treeData.items
      resLastModified = treeData.lastModified
    } else {
      var courseId = Origin.location.route1
      var res = await fetch('/api/content/tree/' + courseId)
      if (!res.ok) throw new Error('Failed to fetch content tree')
      resLastModified = res.headers.get('Last-Modified')
      items = await res.json()
    }
    lastModified = resLastModified
    var content = new Backbone.Collection(items.map(function (item) {
      return new ContentModel(item)
    }), {
      model: ContentModel,
      comparator: '_sortOrder'
    })
    Origin.editor.data.content = content
    Origin.editor.data.course = content.findWhere({ _type: 'course' })
    Origin.editor.data.config = content.findWhere({ _type: 'config' })
    if (!Origin.editor.data.course || !Origin.editor.data.config) {
      return handleError()
    }
  }

  async function loadComponentTypes () {
    var componentTypes = new ContentPluginCollection(undefined, { type: 'component' })
    await componentTypes.fetch()
    Origin.editor.data.componentTypes = componentTypes
  }

  async function isOutdated () {
    try {
      if (Origin.editor.data.course.get('_id') !== Origin.location.route1) {
        lastModified = undefined
        return true
      }
    } catch (e) {
      lastModified = undefined
      return true
    }
    if (!lastModified) return true
    var courseId = Origin.editor.data.course.get('_id')
    var res = await fetch('/api/content/tree/' + courseId, {
      headers: { 'If-Modified-Since': lastModified }
    })
    if (res.status === 304) return false
    if (!res.ok) throw new Error('Failed to check content staleness')
    return {
      items: await res.json(),
      lastModified: res.headers.get('Last-Modified')
    }
  }

  function handleError () {
    Origin.Notify.alert({ type: 'error', text: 'Failed to fetch course data' })
    Origin.router.navigateTo('projects')
  }

  return Preloader
})
