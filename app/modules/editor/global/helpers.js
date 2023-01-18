define(function(require) {
  var Handlebars = require('handlebars');
  var Origin = require('core/origin');

  var Helpers = {
    /**
    * set the page title based on location
    * expects backbone model
    */
    setPageTitle: function(model) {
      getNearestPage(model, function(page) {
        var data = {
          model: model || {},
          page: page,
          langString: Origin.l10n.t('app.' + getLangKey())
        };
        Origin.trigger('contentHeader:updateTitle', {
          breadcrumbs: generateBreadcrumbs(data),
          title: getTitleForModel(data)
        });
      });
    }
  }

  /**
  * Private functons
  */

  function getType() {
    return Origin.location.route2 || Origin.location.route1;
  }

  function getAction() {
    if(Origin.location.route2 === 'component' && Origin.location.route3 === 'new') {
      return 'edit';
    }
    return Origin.location.route4;
  }

  function generateBreadcrumbs(data) {
    var type = getType();
    var action = getAction();
    var isMenu = type === 'menu';
    var isEditor = action === 'edit';
    var crumbs = ['dashboard'];

    if (!isMenu || isEditor) {
      crumbs.push('course');
    }
    if (!isMenu && isEditor) {
      crumbs.push({
        title: Origin.l10n.t('app.editorpage'),
        url: '#/editor/' + data.page.get('_courseId') + '/page/' + data.page.get('_id')
      });
    }
    crumbs.push({ title: data.langString });
    return crumbs;
  }

  function getTitleForModel(data) {
    var modelTitle = data.model.title || data.model.get && data.model.get('title');
    return modelTitle || Origin.editor.data.course.get('title');
  }

  function getLangKey() {
    var type = getType();
    var action = getAction();

    if ((type === 'page' || type === 'menu') && action === 'edit') {
      return 'editorpagesettings';
    }
    return 'editor' + type;
  }

  function getNearestPage(model, cb) {
    var _recurse = function(model) {
      var type = model.get('_type');
      
      if(!type || type === 'course' || type === 'config') {
        return cb(); // pages don't apply here, so just return
      }
      if (type === 'page' || type === 'menu') {
        return cb(model); // we're at the top of the hierarchy
      }
      _recurse(model.parent);
    };
    // start recursion
    _recurse(model);
  }

  return Helpers;
});
