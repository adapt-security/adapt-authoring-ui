define(['core/views/originView'], function(OriginView) {
  var ColorLabelPopUpView = OriginView.extend({
    className: 'colorlabel',
    events: {
      'click .reset': 'onReset',
      'click .apply': 'onApply',
      'click .cancel': 'remove',
      'click .color-item': 'onItemClick'
    },

    initialize: function(options) {
      this.parentView = options.parentView;
      this.selected = null;
      OriginView.prototype.initialize.apply(this, arguments);
    },

    onItemClick: function(event) {
      this.selected = $(event.currentTarget).data('colorlabel');
      this.updateClasses();
    },

    updateClasses: function() {
      this.$('.color-item').removeClass('selected');
      this.$(`[data-colorlabel="${this.selected}"]`).addClass('selected');
    },

    onReset: function() {
      var model = this.parentView.model;
      this.selected = null;

      model.save('_colorLabel', '', {
        patch: true,
        success: () => this.onSuccess(),
        error: (model, response) => this.onError(response)
      });
    },
    onApply: function(event) {
      if(this.selected) this.addItem();
    },

    postRender: function() {
      var color = this.parentView.model.get('_colorLabel');
      if (!color) return;
      this.selected = color;
      this.updateClasses();
    },

    applyOnParent: function() {
      this.parentView.$el.attr('data-colorlabel', this.selected);
    },

    addItem: function() {
      var model = this.parentView.model;

      model.save('_colorLabel', this.selected, {
        patch: false,
        success: () => this.onSuccess(),
        error: (model, response) => this.onError(response)
      });
    },

    onSuccess: function() {
      this.applyOnParent()
      this.remove();
    },

    onError: function(response) {
      this.remove();
      alert(response);
    }
}, {
  template: 'colorLabelPopUpView'
});
  return ColorLabelPopUpView;
});