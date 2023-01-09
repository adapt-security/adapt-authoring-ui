// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorFormView = require('modules/editor/global/views/editorFormView');
  var ProjectsView = require('./views/projectsView');
  var ContentCollection = require('core/collections/contentCollection');
  var CourseModel = require('core/models/courseModel');
  var TagsCollection = require('core/collections/tagsCollection');

  Origin.on('router:projects', function(location, subLocation, action) {
    Origin.trigger('editor:resetData');

    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.SORTS, [
      {
        items: [
          {
            buttonText: 'Title',
            eventName: 'title'
          },
          {
            buttonText: 'Last updated',
            eventName: 'update'
          }
        ]
      }
    ]);
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.FILTERS, [
      {
        items: [
          {
            type: 'toggle',
            buttonText: Origin.l10n.t('app.myprojects'),
            checked: true,
            eventName: 'mine'
          },
          {
            type: 'toggle',
            buttonText: Origin.l10n.t('app.sharedprojects'),
            checked: true,
            eventName: 'shared'
          },
          {
            type: 'search',
            buttonText: Origin.l10n.t('app.search'),
            placeholder: Origin.l10n.t('app.searchbyname'),
            eventName: 'search'
          },
          {
            type: 'tags',
            buttonText: Origin.l10n.t('app.tags'),
            eventName: 'tags'
          }
        ]
      }
    ]);

    const actionButtons = [{
      buttonText: Origin.l10n.t('app.addnewproject'),
      eventName: 'createcourse'
    }];
    if(Origin.sessionModel.hasScopes(["import:adapt"])) {
      actionButtons.push({
        buttonText: Origin.l10n.t('app.importcourse'),
        buttonClass: 'action-secondary',
        eventName: 'importcourse'
      });
    }
    Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.ACTIONS, [{ items: actionButtons }]);
    
    (new TagsCollection()).fetch({
      success: function(collection) {
        Origin.trigger('dashboard:loaded', { type: location || 'all', tags: collection });
      },
      error: () => console.log('Error occured getting the tags collection - try refreshing your page')
    });
  });
  

  Origin.on('dashboard:loaded', function ({ type, tags }) {
    var isMine = type === 'all';
    var isShared = type === 'shared';
    if(!isMine && !isShared) {
      return;
    }
    var meId = Origin.sessionModel.get('user')._id;
    var collection = new ContentCollection(undefined, { 
      filter: { createdBy: isMine ? meId : { $ne: meId } }, 
      _type: 'course'
    });
    Origin.trigger('contentHeader:updateTitle', { 
      breadcrumbs: ['dashboard'], 
      title: Origin.l10n.t(`app.projects`) 
    });
    Origin.contentPane.setView(ProjectsView, { collection, _isShared: isShared, tags }, { fullWidth: true });
  });

  Origin.on('router:initialize login:changed', function() {
    Origin.router.addDashboardHandler(() => {
      if(Origin.sessionModel.hasScopes(['read:content'])) return 'projects';
    });
  });
});
