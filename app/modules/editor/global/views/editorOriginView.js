// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var ColorLabelPopupView = require('./colorLabelPopupView');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var EditorOriginView = OriginView.extend({
    events: {
      'click .paste-cancel': 'onPasteCancel',
      'click .field-object .legend': 'onFieldObjectClicked',
      'dblclick .editor-item-settings-inner > button': 'onDbClick',
      'contextmenu': 'onContextMenu'
    },

    attributes: function() {
      var colorLabel = this.model && this.model.get('_colorLabel');
      if (colorLabel) return { 'data-colorlabel': colorLabel };
    },

    initialize: function(options) {
      // Set form on view
      if (options && options.form) {
        this.form = options.form;
        this.filters = [];
      }
      OriginView.prototype.initialize.apply(this, arguments);

      this.listenTo(Origin, {
        'sidebarFieldsetFilter:filterForm': this.filterForm,
        'editorView:pasteCancel': this.hidePasteZones
      });
      if(this.model) {
        this.on(`contextMenu:${this.model.get('_type')}:colorLabel`, this.showColorLabelPopup);
      }
    },

    render: function() {
      OriginView.prototype.render.apply(this, arguments);
      
      if(this.model) this.$el.attr('data-id', this.model.get('_id'));

      return this;
    },

    postRender: function() {
      if (!this.form) {
        return this.setViewToReady();
      }
      this.$('.form-container').append(this.form.el);
      // Set the delays going to stop jumping pages
      _.delay(_.bind(this.setViewToReady, this, 400));
    },

    filterForm: function(filter) {
      // toggle filter
      if(this.filters.includes(filter)) {
        this.filters = _.reject(this.filters, filterItem => filterItem === filter);
      } else {
        this.filters.push(filter);
      }
      // Now actually filter the form
      if(this.filters.length) {
        $('.form-container > form > div > fieldset').addClass('display-none');
        this.filters.forEach(f => $(`fieldset[data-key=${f}]`).removeClass('display-none'));
      } else {
        $('.form-container > form > div > fieldset').removeClass('display-none');
      }
    },

    componentPasteLocation: function() {
      if ($('.block-inner .add-control').length > 0) return;
      Origin.Notify.toast({
        type: 'error',
        text: Origin.l10n.t('app.componentcopyerror')
      });
      $('.add-control').removeClass('display-none');
    },

    showPasteZones: function(type) {
      $('.paste-zone').addClass('display-none');
      $('.add-control').addClass('display-none');
      if(type) $('.paste-zone-' + (type === 'menu' ? 'page' : type)).removeClass('display-none').addClass('show');
      if(this.currentView === "page") {
        this.componentPasteLocation();
      }
    },

    hidePasteZones: function() {
      $('.paste-zone').removeClass('show');
      // FIXME timeout for animation
      setTimeout(function() { $('.paste-zone').addClass('display-none'); }, 300);
      $('.add-control').removeClass('display-none');
    },

    showDropZones: function (supportedLayout) {
      $('.paste-zone').addClass('display-none');
      $('.add-control').addClass('display-none');
      $(`.paste-zone-${this.model.get('_type')} a`).addClass('display-none');
      // Components may be restricted to either full or half width so
      // make sure only the appropriate paste zones are displayed
      var type = this.model.get('_type');
      var pasteZoneSelector = '.paste-zone-'+ type;
      var $pasteZones;

      if (type === 'component') {
        $pasteZones = $();
        if (supportedLayout.full) {
          $pasteZones = $pasteZones.add('.paste-zone-component-full');
        }
        if (supportedLayout.half) {
          $pasteZones = $pasteZones.add('.paste-zone-component-left, .paste-zone-component-right');
        }
      } else {
        $pasteZones = $(pasteZoneSelector);
      }
      $(pasteZoneSelector + ' a').addClass('display-none');

      $pasteZones
        .addClass('paste-zone-available')
        .removeClass('display-none');

      this.$el.parent()
        .children('.drop-only')
        .removeClass('display-none');
    },

    hideDropZones: function() {
      $('.paste-zone')
        .addClass('display-none')
        .removeClass('paste-zone-available');

      $('.add-control').removeClass('display-none');
      $('.paste-zone a').removeClass('display-none');

      this.$el.parent()
        .children('.drop-only')
        .addClass('display-none');
    },

    save: function() {
      if(!this.form) {
        return;
      }
      var errors = this.form.validate();
      // MUST trigger as sidebar needs to know when the form has been resubmitted
      Origin.trigger('editorSidebar:showErrors', errors);

      if(errors) {
        var errorText = `${Origin.l10n.t('app.validationfailedmessage')}<br/><br/>${this.buildErrorMessage(errors)}`;
        // TODO remove when we've got a better solution
        this.onSaveError(Origin.l10n.t('app.validationfailed'), errorText);
        return;
      }
      this.form.commit();
      this.model.pruneAttributes();

      var attrs = this.getAttributesToSave();
      if(attrs) attrs._type = this.model.get('_type');

      this.model.save(attrs, {
        patch: !!attrs,
        success: this.onSaveSuccess.bind(this),
        error: (model, jqXhr) => this.onSaveError(undefined, jqXhr.responseJSON && jqXhr.responseJSON.message)
      });
    },

    deletePrompt: function() {
      Origin.Notify.alert({
        type: 'warning',
        text: Origin.l10n.t('app.confirmdelete', { type: this.model.get('_type') }),
        showCancelButton: true,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            await this.model.destroy(/* {silent: false} */) // uncomment to see toast error
          } catch (e) {
            Origin.Notify.toast({ type: 'error', title: Origin.l10n.t('app.errordeletetitle'), text: e.message });
          }
        }
      });
    },

    buildErrorMessage: function(errorObjs, message) {
      if(!message) {
        message = "";
      }
      _.each(errorObjs, function(item, key) {
        if(item.hasOwnProperty('message')) {
          message += `<span class="key">${item.title || key}</span>: ${item.message}<br/>`;
        } else if(_.isObject(item)) { // recurse
          message = this.buildErrorMessage(item, message);
        }
      }, this);
      return message;
    },

    getAttributesToSave: function() {
      return this.model.changedAttributes() || undefined;
    },

    // Event handling

    openContextMenu: function (e) {
      if(e) {
        e.stopPropagation();
        e.preventDefault();
      }
      Origin.trigger('contextMenu:open', this, e);
    },

    showColorLabelPopup: function() {
      (new ColorLabelPopupView({ parentView: this })).$el.appendTo(document.body);
    },

    onFieldObjectClicked: function(event) {
      $(event.currentTarget)
        .closest('.field-object')
        .children('.collapsed')
        .first()
        .toggleClass('expanded');
    },

    onDbClick: function(event) {
      event.preventDefault();
      event.stopPropagation();
    },

    onCut: function(e) {
      e?.preventDefault?.();
      Origin.trigger('editorView:cut', this.model);
    },

    onCopy: function(e) {
      e?.preventDefault?.();
      Origin.trigger('editorView:copy', this.model);
    },

    onCopyID: function(e) {
      e?.preventDefault?.();
      Origin.trigger('editorView:copyID', this.model);
    },

    onPaste: function(e) {
      // TODO: this function was hitherto unused
      // the EditorPageBlockView override also seems to be unused

      // onPaste, onCopy, onCopyID and some others
      // relate only to content and so probably need to live in a new *class*
      // EditorOriginView > *EditorContentView* > [EditorMenuView, EditorPageView etc]
      // however, if we initially want to do this as a private plugin using overrides we don't want the complication of a new inheritance structure

      e?.stopPropagation?.();
      e?.preventDefault?.();

      const source = _.last(Origin.editor.clipboard);

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
          this.emitPasteEvent()
        } else {
          showError('app.errorpasteoutofscope')
        }
      } else if (indexOfSource > indexOfPage && indexOfTarget < indexOfPage) {
        // page content must be pasted into a page
        showError('app.errorpasteoutsidepage')
      } else {
        this.emitPasteEvent()
      }

      function showError(keyText, keyTitle = 'app.errordefaulttitle', ) {
        Origin.Notify.alert({ 
          type: 'error', 
          title: Origin.l10n.t(keyTitle), 
          text: Origin.l10n.t(keyText, {sourceType, targetType})
        });
      }
    },

    getSelectorForSortOrder: function() {
      return `.${this.model.get('_type')}`;
    },

    getSortOrderFromContextMenuPosition: function() {
      if (Origin.contextMenu.view.isClamped) return;

      const typeHierarchy = ['course', 'menu', 'page', 'article', 'block', 'component'];
      const indexOfTarget = typeHierarchy.indexOf(this.model.get('_type'));
      const indexOfPage = typeHierarchy.indexOf('page');
      const isTargetMenuOrCourse = indexOfTarget < indexOfPage;
      const coords = Origin.contextMenu.view.mouseCoords;  
      const selector = isTargetMenuOrCourse ? '.editor-menu-item' : `.${typeHierarchy[indexOfTarget + 1]}`
      const $children = this.$(selector);

      let lowerBoundIndex = -1;

      $children.toArray().find((el, index) => {
        const bounds = el.getBoundingClientRect();
        if (lowerBoundIndex > -1 && coords.y <= bounds.top) return true;
        if (coords.y >= bounds.bottom) lowerBoundIndex = index;
      });

      return lowerBoundIndex + 2; // increment and make 1-based
    },

    emitPasteEvent: function() {
      const source = _.last(Origin.editor.clipboard);
      const sourceType = source.get('_type');
      const sortOrder = this.getSortOrderFromContextMenuPosition();

      console.log(`copy ${sourceType} into ${this.model.get('_type')} ${sortOrder ? 'at position ' + sortOrder : '[sort order unspecified]'}`);
      Origin.trigger('editorView:paste', this.model.get('_id'), sortOrder);
    },

    onPasteCancel: function(e) {
      e && e.preventDefault();
      Origin.trigger('editorView:pasteCancel', this.model);
    },

    onSaveSuccess: function() {
      // TODO: this event is not fired anymore, remove?
      Origin.trigger('editor:refreshData', () => {
        Origin.router.navigateBack();
        this.remove();
      });
    },

    onSaveError: function(pTitle, pText) {
      Origin.Notify.toast({ 
        type: 'error', 
        title: _.isString(pTitle) ? pTitle : Origin.l10n.t('app.errordefaulttitle'), 
        text: _.isString(pText) ? pText : Origin.l10n.t('app.errorsave')
      });
      Origin.trigger('sidebar:resetButtons');
    },

    onContextMenu: function(e) {
      e.preventDefault();
      e.stopPropagation();
      Origin.trigger('contextMenu:open', this, e);
    }
  });

  return EditorOriginView;
});
