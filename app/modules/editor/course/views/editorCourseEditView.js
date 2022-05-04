// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentObjectModel = require('core/models/contentObjectModel');
  var ArticleModel = require('core/models/articleModel');
  var BlockModel = require('core/models/blockModel');
  var ConfigModel = require('core/models/configModel');
  var ComponentModel = require('core/models/componentModel');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorCourseEditView = EditorOriginView.extend({
    className: "course-edit",
    tagName: "div",

    preRender: function() {
      this.listenTo(Origin, 'projectEditSidebar:views:save', this.save);

      if (this.model.isNew()) {
        this.isNew = true;
        this.$el.addClass('project-detail-hide-hero');
      }
      // This next line is important for a proper PATCH request on saveProject()
      this.originalAttributes = _.clone(this.model.attributes);
    },

    getAttributesToSave: function() {
      var changedAttributes = this.model.changedAttributes(this.originalAttributes);
      // should also include anything that's new 
      var newAttributes = _.omit(this.model.attributes, Object.keys(this.originalAttributes));
      _.extend(changedAttributes, newAttributes);

      if(!changedAttributes) {
        return null;
      }
      return _.pick(this.model.attributes, Object.keys(changedAttributes));
    },

    onSaveSuccess: async function(model, response, options) {
      if(!this.isNew) {
        EditorOriginView.prototype.onSaveSuccess.apply(this, arguments);
        return;
      }
      try {
        await this.populateNewCourse();
        Origin.router.navigateTo(`editor/${model.get('_id')}/menu`);
      } catch(e) {
        EditorOriginView.prototype.onSaveError.call(this, null, e.message);
      }
    },
    // When a new course is created it gets populated with a page, article, block and text component
    // so that it can be previewed immediately.
    // @param model
    populateNewCourse: async function() {
      const config = await this.createNewContentObject(ConfigModel);
      const page = await this.createNewContentObject(ContentObjectModel, { _type: 'page', _parentId: this.model.get('_id') });
      const article = await this.createNewContentObject(ArticleModel, { _parentId: page.get('_id') });
      const block = await this.createNewContentObject(BlockModel, {
        _parentId: article.get('_id'),
        layoutOptions: [
          { type: 'left', name: 'app.layoutleft', pasteZoneRenderOrder: 2 },
          { type: 'full', name: 'app.layoutfull', pasteZoneRenderOrder: 1 },
          { type: 'right', name: 'app.layoutright', pasteZoneRenderOrder: 3 }
        ]
      });
      const component = await this.createNewContentObject(ComponentModel, {
        _parentId: block.get('_id'),
        body: Origin.l10n.t('app.projectcontentbody'),
        _component: 'adapt-contrib-text',
        _layout: 'full'
      });
    },

    createNewContentObject: function(Model, data) {
      return new Promise((resolve, reject) => {
        const model = new Model(Object.assign({ _courseId: this.model.get('_id') }, data));
        model.save(null, {
          success: model => resolve(model),
          error: (model, response) => {
            const message = response.responseJson && response.responseJson.message || 'Failed to create data';
            reject(new Error(message));
          }
        });
      });
    }
  }, {
    template: 'editorCourseEdit'
  });

  return EditorCourseEditView;
});
