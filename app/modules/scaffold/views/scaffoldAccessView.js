define([ 'core/origin' ], function(Origin) {
  var TIERS = [ 'onlyme', 'specific', 'anyone' ];

  var ScaffoldAccessView = Backbone.Form.editors.Base.extend({
    tagName: 'div',
    className: 'scaffold-access',
    events: {
      'change .scaffold-access-tier': function(event) {
        this.setTier(event.target.value);
        this.trigger('change', this);
      },
      'focus': function() { this.trigger('focus', this); },
      'blur': function() { this.trigger('blur', this); }
    },

    render: function() {
      this.deriveFromValue(this.value);
      this.$el.html(this.template());
      this.$people = this.$el.find('.scaffold-access-users');
      this.fetchUsers(this.initSelectize);
      this.togglePeople();
      return this;
    },

    template: function() {
      var tier = this.tier;
      var radios = TIERS.map(function(name) {
        return '<label class="scaffold-access-option">' +
          '<input type="radio" class="scaffold-access-tier" name="' + this.id + '-tier"' +
          ' value="' + name + '"' + (name === tier ? ' checked' : '') + '>' +
          '<span>' + Origin.l10n.t('app.scaffold.access.' + name) + '</span>' +
          '</label>';
      }, this).join('');
      return '<div class="scaffold-access-tiers">' + radios + '</div>' +
        '<div class="scaffold-access-people">' +
        '<input class="scaffold-access-users">' +
        '</div>';
    },

    renderItem: function(item, escape) {
      return Handlebars.templates.scaffoldUsersOption({
        name: item.firstName && item.lastName ? escape(item.firstName + ' ' + item.lastName) : false,
        email: escape(item.email),
        disabled: item.disabled
      });
    },

    fetchUsers: function(callback) {
      $.get('api/users')
        .done(callback.bind(this))
        .fail(error => Origin.Notify.alert({ type: 'error', text: error }));
    },

    initSelectize: function(users) {
      this.$people.val(this.users.join(','));

      var meId = Origin.sessionModel.get('id');

      users.forEach(function(user) {
        if(user._id === meId) user.disabled = true;
      });

      this.$people.selectize({
        labelField: 'email',
        valueField: '_id',
        options: users,
        searchField: [ 'email', 'firstName', 'lastName' ],
        render: {
          item: this.renderItem,
          option: this.renderItem
        },
        onChange: () => this.trigger('change', this),
        onItemRemove: function(value) {
          if(value !== Origin.sessionModel.get('id')) {
            return;
          }
          Origin.Notify.alert({
            type: 'warning',
            text: Origin.l10n.t('app.stopsharingwithyourself')
          });
          this.addItem(value, true);
          this.close();
        }
      });
    },

    deriveFromValue: function(value) {
      var access = value || {};
      this.originalAccess = _.extend({}, access);

      var isPublic = access.public;
      if(isPublic === undefined) isPublic = this.model.get('_isShared') || false;

      var users = access.users;
      if(users === undefined) users = this.model.get('_shareWithUsers');
      this.users = (users || []).slice();

      this.tier = isPublic ? 'anyone' : (this.users.length ? 'specific' : 'onlyme');
    },

    setTier: function(tier) {
      this.tier = tier;
      this.togglePeople();
    },

    togglePeople: function() {
      this.$el.find('.scaffold-access-people').toggle(this.tier === 'specific');
    },

    selectedUsers: function() {
      var selectize = this.$people && this.$people[0] && this.$people[0].selectize;
      if(selectize) return selectize.getValue();
      return this.users;
    },

    getValue: function() {
      var access = _.omit(this.originalAccess || {}, 'public', 'users');
      switch(this.tier) {
        case 'anyone':
          access.public = true;
          break;
        case 'specific':
          access.public = false;
          access.users = this.selectedUsers();
          break;
        default:
          access.public = false;
      }
      return access;
    },

    setValue: function(value) {
      this.deriveFromValue(value);
      if(!this.$people) return;
      this.$el.find('.scaffold-access-tier[value="' + this.tier + '"]').prop('checked', true);
      var selectize = this.$people[0] && this.$people[0].selectize;
      if(selectize) selectize.setValue(this.users, true);
      this.togglePeople();
    },

    focus: function() {
      if(!this.hasFocus) this.$el.find('input').first().focus();
    },

    blur: function() {
      if(this.hasFocus) this.$el.find('input').first().blur();
    }
  });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('Access', ScaffoldAccessView);
  });

  return ScaffoldAccessView;
});
