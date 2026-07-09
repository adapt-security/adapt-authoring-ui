// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');
  var ContentModel = require('./contentModel');

  var CourseModel = ContentModel.extend({
    _type: 'course',
    _childTypes: 'contentobject',

    getHeroImageURI: function () {
      if(Helpers.isAssetExternal(this.get('heroImage'))) {
        return this.get('heroImage');
      }
      return `api/assets/serve/${this.get('heroImage')}?thumb=true`;
    },

    isEditable: function () {
      var access = this.get('_access') || {};
      var meId = Origin.sessionModel.get('id');
      return access.public || (access.users || []).includes(meId) || this.get('createdBy') == meId;
    }
  });

  return CourseModel;
});
