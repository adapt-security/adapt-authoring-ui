// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');

  var ProjectView = OriginView.extend({
    className: 'project-list-item',
    tagName: 'li',

    events: {
      'dblclick': 'editProject',
      'click': 'selectProject',
      'click a.open-context-course': 'openContextMenu',
      'click a.course-delete': 'deleteProjectPrompt',
      'click .projects-details-tags-button-show': 'onProjectShowTagsButtonClicked',
      'click .projects-details-tags-button-hide': 'onProjectHideTagsButtonClicked',
      'contextmenu': 'onContextMenu'
    },

    preRender: function() {
      this.listenTo(this, {
        'remove': this.remove,
        'contextMenu:course:editSettings': this.editProjectSettings,
        'contextMenu:course:edit': this.editProject,
        'contextMenu:course:delete': this.deleteProjectPrompt,
        'contextMenu:course:copy': this.duplicateProject,
        'contextMenu:course:copyID': this.copyIdToClipboard,
        'contextMenu:course:paste': this.onPaste,
      });
      this.listenTo(Origin, {
        'dashboard:dashboardView:removeSubViews': this.remove,
        'dashboard:projectView:itemSelected': this.deselectItem,
        'dashboard:dashboardView:deselectItem': this.deselectItem
      });
      this.setHeroURI();
    },

    setHeroURI: function() {
      let heroImageURI = this.model.get('heroImage');
      if(heroImageURI && !Helpers.isAssetExternal(heroImageURI)) {
        heroImageURI = `api/assets/serve/${heroImageURI}`;
      }
      this.model.set('heroImageURI', heroImageURI);
    },

    openContextMenu: function(event) {
      if(event) {
        event.stopPropagation();
        event.preventDefault();
      }
      Origin.trigger('contextMenu:open', this, event);
    },

    editProjectSettings: function(event) {
      event && event.preventDefault();
      Origin.router.navigateTo(`editor/${this.model.get('_courseId')}/settings`);
    },

    editProject: function(event) {
      event?.preventDefault?.();
      Origin.router.navigateTo(`editor/${this.model.get('_courseId')}/menu`);
    },

    selectProject: function(event) {
      event && event.preventDefault();
      this.selectItem();
    },

    selectItem: function() {
      Origin.trigger('dashboard:projectView:itemSelected');
      this.$el.addClass('selected');
      this.model.set({ _isSelected: true });
    },

    deselectItem: function() {
      this.$el.removeClass('selected');
      this.model.set({ _isSelected: false });
    },

    deleteProjectPrompt: function(event) {
      event?.preventDefault?.();
      var isShared = this.model.get('_isShared') || (this.model.get('_shareWithUsers') && this.model.get('_shareWithUsers').length > 0);
      var titleKey = isShared ? 'app.deletesharedproject' : 'app.deleteproject';
      var textKey = isShared ? 'app.confirmdeletesharedprojectwarning' : 'app.confirmdeleteprojectwarning';

      Origin.Notify.confirm({
        type: 'warning',
        title: Origin.l10n.t(titleKey),
        html: Origin.l10n.t('app.confirmdeleteproject') + '<br/><br/>' + Origin.l10n.t(textKey),
        destructive: isShared,
        callback: this.deleteProjectConfirm.bind(this)
      });
    },

    deleteProjectConfirm: function(data) {
      if(!data.isConfirmed) {
        return;
      }
      this.model.destroy({
        success: function() {
          Origin.trigger('dashboard:refresh');
          this.remove();
        }.bind(this),
        error: function(model, response, options) {
          _.delay(() => Origin.Notify.toast({ type: 'error', text: response.responseJSON.message }), 1000);
        }
      });
    },

    duplicateProject: async function() {
      const { SweetAlert } = Origin.Notify.alert({
        title: Origin.l10n.t('app.clonecoursetitle'),
        input: 'text',
        inputLabel: Origin.l10n.t('app.clonecourseinstruction'),
        showCancelButton: true,
        showLoaderOnConfirm: true,
        inputValidator: val => !val && Origin.l10n.t('app.invalidempty'),
        preConfirm: async newTitle => {
          try {
            const { _id } = await $.ajax({
              url: 'api/content/clone',
              method: 'post',
              data: {
                _id: this.model.get('_id'),
                _parentId: this.model.get('_parentId'),
                title: newTitle
              }
            });
            Origin.router.navigateTo(`editor/${_id}/menu`);
            Origin.Notify.toast({ type: 'success', text: Origin.l10n.t('app.clonecoursesuccess', { id: _id }) });
          } catch(e) {
            SweetAlert.showValidationMessage(e.responseJSON && e.responseJSON.message || e);
          }
        }
      });
    },

    copyIdToClipboard: function() {
      var opts = { id: this.model.get('_id') };
      if(Helpers.copyStringToClipboard(opts.id)) {
        Origin.Notify.toast({ type: 'success', text: Origin.l10n.t('app.copyidtoclipboardsuccess', opts) });
      }
    },

    onProjectShowTagsButtonClicked: function(event) {
      if(event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.$('.tag-container').show();
    },

    onProjectHideTagsButtonClicked: function(event) {
      if(event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.$('.tag-container').hide();
    },

    onContextMenu: function(e) {
      e.preventDefault();
      e.stopPropagation();
      Origin.trigger('contextMenu:open', this, e);
    },

    onPaste: function(e) {
      if(e) {
        e.stopPropagation();
        e.preventDefault();
      }
      const source = _.last(Origin.editor.clipboard);
      console.log('copy', source.get('_type'), 'into', this.model.get('_type'));

      const typeHierarchy = ['course', 'menu', 'page', 'article', 'block', 'component'];
      const indexOfSource = typeHierarchy.indexOf(source.get('_type'));
      const indexOfTarget = typeHierarchy.indexOf(this.model.get('_type'));
      const indexOfPage = typeHierarchy.indexOf('page');
      const sourceType = source.get('_type');
      const targetType = this.model.get('_type');

      if (indexOfSource <= indexOfPage && indexOfSource <= indexOfTarget) {
        // at page level and above...
        // cannot paste ancestor into descendant, or same type into same type
        // the exception is menu into menu
        if (source.get('_type') === 'menu' && this.model.get('_type') === 'menu') {
          // OK
          Origin.trigger('editorView:paste', this.model.get('_id'));
        } else {
          showError('app.errorpasteoutofscope')
        }
      } else if (indexOfSource > indexOfPage && indexOfTarget < indexOfPage) {
        // page content must be pasted into a page
        showError('app.errorpasteoutsidepage')
      } else {
        Origin.trigger('editorView:paste', this.model.get('_id'));
      }

      function showError(keyText, keyTitle = 'app.errordefaulttitle', ) {
        Origin.Notify.alert({ 
          type: 'error', 
          title: Origin.l10n.t(keyTitle), 
          text: Origin.l10n.t(keyText, {sourceType, targetType})
        });
      }
    }
  }, {
    template: 'project'
  });

  return ProjectView;
});
