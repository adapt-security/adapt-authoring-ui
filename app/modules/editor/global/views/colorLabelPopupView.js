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
      this.model = new Backbone.Model({
        _colorLabel: this.parentView.model.get('_colorLabel'),
        colors: [
          "colorlabel-1",
          "colorlabel-2",
          "colorlabel-3",
          "colorlabel-4",
          "colorlabel-5",
          "colorlabel-6",
          "colorlabel-7",
          "colorlabel-8",
          "colorlabel-9",
          "colorlabel-10",
          "colorlabel-11",
          "colorlabel-12",
          "colorlabel-13",
          "colorlabel-14"
        ]
      });
      OriginView.prototype.initialize.apply(this, arguments);
      this.onItemClick();
    },

    save: async function() {
      const _colorLabel = this.model.get('_colorLabel');
      await this.parentView.model.save({ _colorLabel }, { patch: true });
      this.parentView.$el.attr('data-colorlabel', _colorLabel);
      this.remove();
    },

    onItemClick: function(event) {
      if(event) {
        this.model.set('_colorLabel', $(event.currentTarget).attr('data-colorlabel'));
      }
      this.$('.color-item').removeClass('selected');
      this.$(`[data-colorlabel="${this.model.get('_colorLabel')}"]`).addClass('selected');
    },

    onApply: async function() {
      this.save();
    },
    
    onReset: function() {
      this.model.set('_colorLabel', '');
      this.save();
    }
}, {
  template: 'colorLabelPopUpView'
});
  return ColorLabelPopUpView;
});