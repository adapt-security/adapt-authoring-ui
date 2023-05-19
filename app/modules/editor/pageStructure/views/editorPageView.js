// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var EditorHelpers = require('modules/editor/global/helpers');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var ContentModel = require('core/models/contentModel');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorPageArticleView = require('./editorPageArticleView');
  var EditorPasteZoneView = require('./editorPasteZoneView');

  var EditorPageView = EditorOriginView.extend({
    className: 'page',
    tagName: 'div',
    childrenRenderedCount: 0,
    events: _.extend({}, EditorOriginView.prototype.events, {
      'click .add-article': 'addNewArticle',
      'click .page-edit-button': 'openContextMenu',
      'dblclick .page-detail': 'loadPageEdit',
      'click .paste-cancel': 'onPasteCancel'
    }),

    preRender: function() {
      EditorHelpers.setPageTitle(this.model);

      Origin.editor.blockCount = 0;
      
      this.listenTo(Origin, {
        'editorView:removeSubViews': this.remove,
        'pageView:itemAnimated': this.onChildRendered,
        'editorData:loaded': this.render
      });
      this.listenTo(this, {
        'contextMenu:editor-page:edit': this.loadPageEdit,
        'contextMenu:editor-page:cut': this.onCut,
        'contextMenu:editor-page:copy': this.onCopy,
        'contextMenu:editor-page:copyID': this.onCopyID,
        'contextMenu:editor-page:paste': this.onPaste
        /* 'contextMenu:editor-page:delete': this.deletePagePrompt */
      });
      /*
      Origin.contentHeader.setButtons(Origin.contentHeader.BUTTON_TYPES.OPTIONS, [
        {
          title: Origin.l10n.t('app.collapseAllArticles'),
          icon: 'minus',
          callbackEvent: 'editorView:collapseArticle:collapse',
          value: 'collapse',
          group: 'collapseArticle',
        },
        {
          title: Origin.l10n.t('app.expandAllArticles'),
          icon: 'plus',
          callbackEvent: 'editorView:collapseArticle:expand',
          value: 'expand',
          group: 'collapseArticle',
        }
      ]);
      */
      this._onScroll = _.bind(_.throttle(this.onScroll, 400), this);
    },

    postRender: function() {
      this.addArticleViews();
      this.setupScrollListener();
    },

    addArticleViews: function() {
      this.$('.page-articles').empty();
      Origin.trigger('editorPageView:removePageSubViews');
      // Insert the 'pre' paste zone for articles
      var prePasteArticle = new ContentModel({
        _parentId: this.model.get('_id'),
        _type: 'article',
        _pasteZoneSortOrder: 1
      });
      this.$('.page-articles').append(new EditorPasteZoneView({ model: prePasteArticle }).$el);
      // Iterate over each article and add it to the page
      this.model.getChildren()
        .filter(c => c.get('_type') === 'article')
        .sort(Helpers.sortContentObjects)
        .forEach(c => this.addArticleView(c));
    },

    addArticleView: function(articleModel, scrollIntoView) {
      scrollIntoView = scrollIntoView || false;

      var newArticleView = new EditorPageArticleView({ model: articleModel });

      this.addChildView(newArticleView, false);

      var sortOrder = articleModel.get('_sortOrder');
      var $articles = this.$('.page-articles .article');
      var index = sortOrder > 0 ? sortOrder-1 : undefined;
      var shouldAppend = index === undefined || index >= $articles.length || $articles.length === 0;

      if(shouldAppend) { // add to the end of the article
        this.$('.page-articles').append(newArticleView.$el);
      } else { // 'splice' block into the new position
        $($articles[index]).before(newArticleView.$el);
      }
      if (scrollIntoView) {
        $.scrollTo(newArticleView.$el, 200);
      }
      // Increment the 'sortOrder' property
      articleModel.set('_pasteZoneSortOrder', sortOrder + 1);
      // Post-article paste zone - sort order of placeholder will be one greater
      this.$('.page-articles').append(new EditorPasteZoneView({ model: articleModel }).$el);
      return newArticleView;
    },

    addNewArticle: async function(event) {
      event && event.preventDefault();
      await new ContentModel({
        _parentId: this.model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id'),
        _type: 'article'
      }).save();
    },

    loadPageEdit: function() {
       Origin.router.navigateTo(`editor/${this.model.get('_courseId')}/page/${this.model.get('_id')}/edit`);
    },

    getContextMenuType(e) {
      return 'editor-page';
    },

    setupScrollListener: function() {
      $('.contentPane').on('scroll', this._onScroll);
    },

    onScroll: function(event) {
      Origin.editor.scrollTo = event.currentTarget.scrollTop;
    },

    removeScrollListener: function() {
      $('.contentPane').off('scroll', this._onScroll);
    },

    onChildRendered: function() {
      this.childrenRenderedCount++;

      if (this.childrenRenderedCount < Origin.editor.blockCount) return;
      if (!_.isFinite(Origin.editor.scrollTo)) return;
      
      if (Origin.editor.scrollTo > 0) {
        this.removeScrollListener();
      }
      $('.contentPane').scrollTo(Origin.editor.scrollTo, {
        duration: 200,
        onAfter: () => this.setupScrollListener()
      });
    },

    remove: function() {
      this.removeScrollListener();
      EditorOriginView.prototype.remove.apply(this, arguments);
    }
  }, {
    template: 'editorPage'
  });

  return EditorPageView;
});
