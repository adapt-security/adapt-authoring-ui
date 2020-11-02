define(['core/origin'], function(Origin) {
  var FilterView = Backbone.View.extend({
    tagName: 'form',
    className: 'user-management-filter',
    events: {
      'change input[type="checkbox"],select': 'onFormChange',
      'input .search-email': 'onSearchInput'
    },

    initialize: function() {
      this.listenTo(Origin, 'remove:views', this.remove);
      this.render();
    },

    onSearchInput: function(event) {
      this.collection.mailSearchTerm = $(event.currentTarget).val().toLowerCase();
      this.collection.sortCollection();
    },

    onFormChange: function() {
      var attributeMap = Array.from(this.$('input:checked')).reduce(function(memo, input) {
        if(!memo[input.name]) memo[input.name] = [];
        memo[input.name].push(input.value);
        return memo;
      }, {});
      this.collection.updateFilter(attributeMap);
    },

    remove: function() {
      this.tenantSelect && this.tenantSelect.destroy();
      Backbone.View.prototype.remove.apply(this, arguments);
    },

    render: function() {
      var template = Handlebars.templates['userManagementFilter'];
      this.$el.html(template({ roles: this.model.get('allRoles').toJSON() }))
        .appendTo('.sidebar-item');
      return this;
    },

    reset: function() {
      this.$('input[type="text"]').prop('disabled', false);
      this.collection.filterGroups = {};
      this.$('input[type="checkbox"]').prop('checked', false);
    }
  });

  return FilterView;
});
