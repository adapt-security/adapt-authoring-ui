// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');
  var ContentModel = require('core/models/contentModel');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorPageBlockView = require('./editorPageBlockView');
  var EditorPasteZoneView = require('./editorPasteZoneView');

  var EditorPageArticleView = EditorOriginView.extend({
    className: 'article editable article-draggable',
    tagName: 'div',

    events: _.extend({}, EditorOriginView.prototype.events, {
      'click .add-block': 'addBlock',
      'click .article-delete': 'deletePrompt',
      'click .open-context-article': 'openContextMenu',
      'dblclick': 'loadArticleEdit',
      'click .editor-collapse-article': 'toggleCollapseArticle'
    }),

    preRender: function() {
      this.listenToEvents();
      Origin.editor.data._collapsedArticles = Origin.editor.data._collapsedArticles || {};
    },
    
    postRender: function() {
      if (!this._skipRender) {
        this.addBlockViews();
      }
      this.setupDragDrop();
      this.restoreCollapsedState();

      _.defer(_.bind(function(){
        this.trigger('articleView:postRender');
        Origin.trigger('pageView:itemRendered');
      }, this));
    },

    listenToEvents: function() {
      this.listenTo(Origin, {
        'editorView:collapseArticle:collapse': this.collapseAllArticles,
        'editorView:collapseArticle:expand': this.expandAllArticles,
        'editorView:removeSubViews editorPageView:removePageSubViews': this.remove
      });
      if (!this.model.isNew()) {
        this.listenTo(Origin, `editorView:deleteArticle:${this.model.get('_id')}`, this.deletePageArticle);
      }
      this.listenTo(this.model, 'change:_isCollapsed', this.onIsCollapsedChange);

      this.listenTo(this, {
        'contextMenu:article:edit': this.loadArticleEdit,
        'contextMenu:article:cut': this.onCut,
        'contextMenu:article:copy': this.onCopy,
        'contextMenu:article:copyID': this.onCopyID,
        'contextMenu:article:cut': this.onCut,
        'contextMenu:article:paste': this.onPaste,
        'contextMenu:article:delete': this.deletePrompt,
        'contextMenu:article:collapse': this.toggleCollapseArticle,
      });
    },

    addBlockViews: function() {
      this.$('.article-blocks').empty();
      // Insert the 'pre' paste zone for blocks
      var view = new EditorPasteZoneView({
        model: new ContentModel({
          _parentId: this.model.get('_id'),
          _type: 'block',
          _pasteZoneSortOrder: 1
        })
      });
      this.$('.article-blocks').append(view.$el);
      // Iterate over each block and add it to the article
      const children = this.model.getChildren().sort(Helpers.sortContentObjects);
      Origin.editor.blockCount += children.length;
      children.forEach(c => this.addBlockView(c));
    },

    addBlockView: function(blockModel, scrollIntoView) {
      scrollIntoView = scrollIntoView || false;

      var newBlockView = new EditorPageBlockView({ model: blockModel });

      this.addChildView(newBlockView, false);

      var $blocks = this.$('.article-blocks .block');
      var sortOrder = blockModel.get('_sortOrder');
      var index = sortOrder > 0 ? sortOrder-1 : undefined;
      var shouldAppend = index === undefined || index >= $blocks.length || $blocks.length === 0;

      if(shouldAppend) { // add to the end of the article
        this.$('.article-blocks').append(newBlockView.$el);
      } else { // 'splice' block into the new position
        $($blocks[index]).before(newBlockView.$el);
      }
      if (scrollIntoView) $.scrollTo(newBlockView.$el, 200);
      // Increment the sortOrder property
      blockModel.set('_pasteZoneSortOrder', (blockModel.get('_sortOrder')+1));
      // Post-block paste zone - sort order of placeholder will be one greater
      this.$('.article-blocks').append(new EditorPasteZoneView({ model: blockModel }).$el);
    },

    addBlock: async function(event) {
      event && event.preventDefault();
      new ContentModel({
        _parentId: this.model.get('_id'),
        _courseId: Origin.editor.data.course.get('_courseId'),
        _type: 'block'
      }).save();
    },

    getRouteIdentifier: function() {
      return this.model.get('_friendlyId') || this.model.get('_id');
    },

    loadArticleEdit: function (event) {
      var courseId = Origin.editor.data.course.get('_courseId');
      var routeId = this.getRouteIdentifier();
      Origin.router.navigateTo(`editor/${courseId}/${routeId}/edit`);
    },

    setupDragDrop: function() {
      var view = this;
      var autoScrollTimer = false;
      var $container = $('.contentPane');

      this.$el.draggable({
        scroll: true,
        opacity: 0.8,
        handle: '.handle',
        revert: 'invalid',
        zIndex: 10000,
        cursorAt: {
          top: 22,
          left: 0
        },
        appendTo:'.contentPane',
        containment: '.contentPane',
        helper: function (e) {
          // Store the offset to stop the page jumping during the start of drag
          // because of the drop zones changing the scroll position on the page
          view.offsetTopFromWindow = view.$el.offset().top - $(window).scrollTop();
          // This is in the helper method because the height needs to be
          // manipulated before the drag start method due to adding drop zones
          view.showDropZones();
          $(this).attr(`data-${view.model.get('_type')}-id`, view.model.get('_id'));
          $(this).attr(`data-${view.model.get('_parent')}-id`, view.model.get('_parentId'));
          return $(`<div class="drag-helper">${view.model.get('title')}</div>`);
        },
        start: function(event) {
          // Using the initial offset we're able to position the window back in place
          $(window).scrollTop(view.$el.offset().top -view.offsetTopFromWindow);
        },
        // adds a scroll if dragging near the top/bottom
        drag: function(event) {
          window.clearInterval(autoScrollTimer);

          var SCROLL_THRESHOLD = $container.height()*0.2;
          var SCROLL_INCREMENT = 7;

          var offsetTop = $container.offset().top;
          var clientY = event.originalEvent.clientY;
          var scrollAmount;

          if (clientY < (offsetTop+SCROLL_THRESHOLD)) {
            scrollAmount = -SCROLL_INCREMENT;
          }
          else if (clientY > (($container.height()+offsetTop) - SCROLL_THRESHOLD)) {
            scrollAmount = SCROLL_INCREMENT;
          }

          if(scrollAmount) {
            autoScrollTimer = window.setInterval(function() {
              $container.scrollTop($container.scrollTop()+scrollAmount);
            }, 10);
          }
        },
        stop: function () {
          window.clearInterval(autoScrollTimer);
          view.hideDropZones();
          $container.scrollTop($(this).offset().top*-1);
        }
      });
    },

    restoreCollapsedState: function() {
      if (!Origin.editor.data._collapsedArticles.hasOwnProperty(this.model.get('_id'))) return;
      this.skipAnimation = true;
      this.model.set('_isCollapsed', Origin.editor.data._collapsedArticles[this.model.get('_id')]);
    },

    toggleCollapseArticle: function(event) {
      event && event.preventDefault();

      Origin.trigger('options:reset:ui', 'collapseArticle');
      var isCollapsed = this.model.get('_isCollapsed');
      this.model.set('_isCollapsed', !isCollapsed);
    },

    onIsCollapsedChange: function(model, isCollapsed) {
      var title;
      if (isCollapsed) {
        title = Origin.l10n.t('app.expandarticle');
      } else {
        title = Origin.l10n.t('app.collapsearticle');
      }
      this.$('.editor-collapse-article').attr('title', title);
      Origin.editor.data._collapsedArticles[this.model.get('_id')] = isCollapsed;
      this.collapseArticle();
    },

    collapseAllArticles: function() {
      if (this.model.get('_isCollapsed') === true) return; 
      this.model.set('_isCollapsed', true);
    },

    expandAllArticles: function() {
      if (this.model.get('_isCollapsed') === false) return; 
      this.model.set('_isCollapsed', false);
    },

    collapseArticle: function() {
      var shouldCollapse = this.model.get('_isCollapsed');

      this.$el.toggleClass('collapsed-view', shouldCollapse);
      var duration = 200;
      if (this.skipAnimation) {
        this.skipAnimation = false;
        duration = 0;
      }
      this.$('.article-content')[shouldCollapse ? 'slideUp' : 'slideDown'](duration);
    }

  }, {
    template: 'editorPageArticle'
  });

  return EditorPageArticleView;
});
