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
    },

    parseLocationData: function() {
      /* var data = {
        contentType: Origin.location.route2,
        type: Origin.location.route2,
        id: Origin.location.route3,
        action: Origin.location.route4
      };
      if(data.type === 'page' || data.type === 'menu') {
        data.contentType = 'contentObject';
      }
      if(data.type === 'settings') {
        data.contentType = 'course';
      }
      if(data.contentType === 'config' || data.contentType === 'course') {
        data.id = data.contentType === 'course' ? Origin.location.route1 : Origin.editor.data.config.get('_id');
        data.action = 'edit';
      }
      */
      const data = {
        courseId: Origin.location.route1,
        type: Origin.location.route2,
        contentType: Origin.location.route2,
        id: Origin.location.route2,
        action: Origin.location.route3
      }
      
      if (data.id === 'component') {
        data.contentType = data.type = 'component';
      }
      else if (data.id === 'page' || data.id === 'menu') {
        data.contentType = 'contentObject';
        data.type = data.id;
        delete data.id;
      } else if (data.id === 'settings') {
        data.contentType = data.type = 'course';
        data.id = data.courseId;
        data.action = 'edit';
      } else if (data.id === 'config' || data.id === 'course') {
        // TODO: ensure user cannot choose 'config'/'course' for _friendlyId
        // TODO: check if link to 'course' is actually used
        data.contentType = data.type = data.id === 'course' ? 'course' : 'config'
        data.id = data.id === 'course' ? data.courseId : Origin.editor.data.config.get('_id');
        data.action = 'edit';
      }
      else {
        const model = Origin.editor.data.get({_friendlyId:data.id}) || Origin.editor.data.get({_id:data.id})
        if (model) {
          const type = model.get('_type')
          if (type === 'page' || type === 'menu') {
            data.contentType = 'contentObject'
            data.type = type;
          } else {
            data.contentType = data.type = type;
          }
        }
      }
  
      return data;
    }
  }

  /**
  * Private functons
  */

  function getType(locationData) {
    locationData = locationData ?? Helpers.parseLocationData();
    return locationData.type;
  }

  function getAction(locationData) {
    locationData = locationData ?? Helpers.parseLocationData();
    if(locationData.type === 'component' && locationData.id === 'new') {
      return 'edit';
    }
    return Origin.location.route3 || '';
  }

  function getRouteIdentifier(model) {
    return model.get('_friendlyId') || model.get('_id');
  }

  function generateBreadcrumbs(data) {
    var locationData = Helpers.parseLocationData();
    var type = getType(locationData);
    var action = getAction(locationData);
    var isMenu = type === 'menu';
    var isEditor = action === 'edit';
    var crumbs = [];

    if (!isMenu || isEditor) {
      crumbs.push('course');
    }
    if (!isMenu && isEditor) {
      crumbs.push({
        title: Origin.l10n.t('app.editorpage'),
        url: `#/editor/${data.page.get('_courseId')}/${getRouteIdentifier(data.page)}`
      });
    }
    crumbs.push({ title: data.langString });
    return crumbs;
  }

  function getTitleForModel(data) {
    var type = data.model && data.model.get && data.model.get('_type');
    if(type === 'menu') {
      return Origin.l10n.t('app.coursestructuretitle');
    }
    if(type === 'course') {
      return Origin.l10n.t('app.coursesettingstitle');
    }
    if(type === 'config') {
      return Origin.l10n.t('app.configsettingstitle');
    }
    var modelTitle = data.model.title || data.model.get && data.model.get('title');
    return modelTitle || Origin.editor.data.course.get('title');
  }

  function getLangKey() {
    var locationData = Helpers.parseLocationData();
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
    }[`${getType(locationData)}${getAction(locationData)}`];
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
