// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var ContentHeaderView = require('./views/contentHeaderView');
  var OptionsView = require('./views/optionsView');

  class ContentHeader {
    constructor() {
      Origin.on('appHeader:postRender', this.render.bind(this));
    }
    render() {
      this.$el = new ContentHeaderView().$el;
      $('#app').prepend(this.$el);
    }
    setActions(items) {
      // TODO
    }
    setFilters(items) {
      // TODO
    }
    setSorts(items) {
      // TODO
    }
    /**
     * Legacy
    */
    setItems(items) {
      this.$el.append(new OptionsView({ collection: new Backbone.Collection(items) }).$el);
    }
  }

  Origin.contentHeader = new ContentHeader();
})
