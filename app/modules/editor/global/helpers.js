define(function(require) {
  var Origin = require('core/origin');

  var Helpers = {
    /**
    * set the page title based on location
    * expects backbone model
    */
    setPageTitle: function(model) {
      const page = getNearestPage(model);
      var data = {
        model: model || {},
        page: page,
        langString: Origin.l10n.t(getLangKey())
      };
      Origin.contentHeader.setTitle({
        breadcrumbs: generateBreadcrumbs(data),
        title: getTitleForModel(data)
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
    return Origin.location.route4 || '';
  }

  function generateBreadcrumbs(data) {
    var type = getType();
    var action = getAction();
    var isMenu = type === 'menu';
    var isEditor = action === 'edit';
    var crumbs = [];

    if (!isMenu || isEditor) {
      crumbs.push('course');
    }
    if (!isMenu && isEditor) {
      crumbs.push({
        title: Origin.l10n.t('app.editorpage'),
        url: `#/editor/${data.page.get('_courseId')}/page/${data.page.get('_id')}`
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
    return {
      settings: 'app.editorcourse',
      config: 'app.editorconfig',
      pageedit: 'app.editorpagesettings',
      page: 'app.editorpage',
      menuedit: 'app.editorpagesettings',
      menu: 'app.editormenu',
      menusettings: 'app.editormenupicker',
      articleedit: 'app.editorarticle',
      blockedit: 'app.editorblock',
      componentedit: 'app.editorcomponent'
    }[`${getType()}${getAction()}`];
  }

  function getNearestPage(model, cb) {
    do {
      switch(model.get('_type')) {
        case 'course': 
        case 'config': 
        case undefined: 
          return;
        case 'page': 
        case 'menu': 
          return model;
        default: 
          model = model.getParent();
      }
    } while(model);
  }

  return Helpers;
});
