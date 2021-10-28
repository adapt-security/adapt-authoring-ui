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
    },

    preRender: function() {
      this.listenTo(this, {
        'remove': this.remove,
        'contextMenu:course:editSettings': this.editProjectSettings,
        'contextMenu:course:edit': this.editProject,
        'contextMenu:course:delete': this.deleteProjectPrompt,
        'contextMenu:course:copy': this.duplicateProject,
        'contextMenu:course:copyID': this.copyIdToClipboard
      });
      this.listenTo(Origin, {
        'dashboard:dashboardView:removeSubViews': this.remove,
        'dashboard:projectView:itemSelected': this.deselectItem,
        'dashboard:dashboardView:deselectItem': this.deselectItem
      });
      this.model.set('heroImageURI', this.model.getHeroImageURI());
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
      Origin.router.navigateTo(`editor/${this.model.get('_id')}/settings`);
    },

    editProject: function(event) {
      event && event.preventDefault();
      Origin.router.navigateTo(`editor/${this.model.get('_id')}/menu`);
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
      event && event.preventDefault();
      var isShared = this.model.get('_isShared') || (this.model.get('_shareWithUsers') && this.model.get('_shareWithUsers').length > 0);
      var titleKey = isShared ? 'deletesharedproject' : 'deleteproject';
      var textKey = isShared ? 'confirmdeletesharedprojectwarning' : 'confirmdeleteprojectwarning';

      Origin.Notify.confirm({
        type: 'warning',
        title: Origin.l10n.t('app.' + titleKey),
        html: Origin.l10n.t('app.confirmdeleteproject') + '<br/><br/>' + Origin.l10n.t('app.' + textKey),
        destructive: true,
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
          _.delay(() => Origin.Notify.alert({ type: 'error', text: response.responseJSON.message }), 1000);
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
          } catch(e) {
            SweetAlert.showValidationMessage(e);
          }
        }
      });
    },

    copyIdToClipboard: function() {
      var opts = { id: this.model.get('_id') };
      if(Helpers.copyStringToClipboard(opts.id)) {
        Origin.Notify.toast({ type: 'info', text: Origin.l10n.t('app.copyidtoclipboardsuccess', opts) });
        return;
      }
      Origin.Notify.alert({ type: 'warning', text: Origin.l10n.t('app.app.copyidtoclipboarderror', opts) });
    },

    onProjectShowTagsButtonClicked: function(event) {
      if(event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.$('.tag-container').show().velocity({ opacity: 1 });
    },

    onProjectHideTagsButtonClicked: function(event) {
      if(event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.$('.tag-container').velocity({ opacity: 0 }).hide();
    }
  }, {
    template: 'project'
  });

  return ProjectView;
});
