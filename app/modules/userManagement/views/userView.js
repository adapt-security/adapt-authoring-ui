// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');
  var Helpers = require('../helpers');

  var UserView = OriginView.extend({
    isSelected: false,
    tagName: 'div',
    className: function() {
      const classes = ['user-item', 'tb-row', this.model.get('_id')];
      if(this.model.get('_id') === Origin.sessionModel.get('id')) {
        classes.push('me');
      }
      if(this.model.get('_isHidden')) {
        classes.push('display-none');
      }
      return classes.join(' ');
    },

    events: {
      'click': 'onClicked',

      'click a.edit': 'onEditClicked',
      'click a.save': 'onSaveClicked',
      'click a.cancel': 'onCancelClicked',

      'click a.saveRoles': 'onSaveRoleClicked',

      'click button.invite': 'onInviteClicked',
      'click button.resetPassword': 'onResetPasswordClicked',
      'click button.changePassword': 'onChangePasswordClicked',

      'click button.unlock': 'onResetLoginsClicked',

      'click button.disable': 'onDisableClicked',
      'click button.delete': 'onDeleteClicked',
      'click button.restore': 'onRestoreClicked'
    },

    preRender: function() {
      this.listenTo(Origin, 'userManagement:user:reset', this.resetView);
      this.listenTo(this, 'remove', this.remove);
      this.listenTo(this.model, {
        'destroy': this.remove,
        'change:_isHidden': this.toggleHidden
      });
    },

    render: function() {
      OriginView.prototype.render.apply(this, arguments);
      this.applyStyles();
    },

    applyStyles: function() {
      // disabled user styling
      this.$el.toggleClass('inactive', !this.model.get('isEnabled'));
      // locked user styling
      this.$el.toggleClass('locked', (this.model.get('isTempLocked') || this.model.get('isPermLocked')));
      // selected user styling
      if(this.isSelected) {
        this.$el.addClass('selected');
        this.$('.edit-mode').removeClass('display-none');
        this.$('.write').addClass('display-none');
      } else {
        this.$el.removeClass('selected');
        this.$('.edit-mode').addClass('display-none');
        this.$('.write').addClass('display-none');
      }
    },

    resetView: function() {
      if(this.isSelected) {
        this.isSelected = false;
        this.applyStyles();
      }
    },

    // utilities in case the classes change
    getColumnFromDiv: div => $(div).closest('.tb-col-inner'),
    getInputFromDiv: div => $('.input', this.getColumnFromDiv(div)),

    disableFieldEdit: function(div) {
      $('.read', div).removeClass('display-none');
      $('.write', div).addClass('display-none');
    },

    toggleHidden: function(model, _isHidden) { 
      this.$el.toggleClass('display-none', _isHidden); 
    },

    enableFieldEdit: function(div) {
      $('.read', div).addClass('display-none');
      $('.write', div).removeClass('display-none').children('input').focus();
    },

    onEditClicked: function(event) {
      event && event.preventDefault();

      var $column = this.getColumnFromDiv(event.currentTarget);
      // disable any existing inputs first
      this.disableFieldEdit(this.$el);
      this.enableFieldEdit($column);
      var $input = this.getInputFromDiv($column);
      var inputType = $input.attr('type');
      if(inputType === "text" || inputType === "email") {
        $input.val(this.model.get($input.attr('data-modelKey')));
      }
    },

    onClicked: function(event) {
      if(this.isSelected) return;
      // will reset the old selection
      Origin.trigger('userManagement:user:reset');
      this.isSelected = true;
      this.applyStyles();
    },

    onSaveClicked: function(event) {
      event && event.preventDefault();

      var $column = this.getColumnFromDiv(event.currentTarget);
      this.disableFieldEdit($column);
      // save if not the same as old value
      var $input = this.getInputFromDiv($column);
      this.updateModel($input.attr('data-modelKey'), $input.val());
    },

    onCancelClicked: function(event) {
      event && event.preventDefault();
      this.disableFieldEdit(this.getColumnFromDiv(event.currentTarget));
    },

    onSaveRoleClicked: function(event) {
      event && event.preventDefault();

      var $column = this.getColumnFromDiv(event.currentTarget);
      var $input = this.getInputFromDiv($column);
      var oldRole = this.model.get('roles')[0];
      var newRole = $input.val();

      this.disableFieldEdit($column);

      if(!newRole || this.model.get($input.attr('data-modelKey')) === newRole) {
        return;
      }
      var _id = this.model.get('_id');
      Helpers.ajax(`api/role/${oldRole}/unassign/${_id}`, null, 'POST', () => {
        Helpers.ajax(`api/role/${newRole}/assign/${_id}`, null, 'POST', () => this.model.fetch());
      });
    },

    onResetLoginsClicked: function() {
      Origin.Notify.confirm({
        text: Origin.l10n.t('app.confirmresetlogins', { email: this.model.get('email') }),
        callback: result => {
          if(!result.isConfirmed) return;
          Helpers.ajax(`api/auth/local/unlock/${this.model.get('_id')}`, null, 'POST', () => this.model.fetch());
        }
      });
    },

    onInviteClicked: function(e) {
      Origin.Notify.confirm({
        text: Origin.l10n.t('app.confirmsendinvite', { email: this.model.get('email') }),
        callback: result => {
          if(!result.isConfirmed) {
            return;
          }
          var $btn = $(e.target);
          $btn.addClass('submitted');
          Helpers.ajax('api/auth/local/invite', { email: this.model.get('email') }, 'POST', () => {
            $btn.removeClass('submitted');
            Origin.Notify.alert({
              type: 'success',
              text: Origin.l10n.t('app.invitesent', { email: this.model.get('email') })
            });
          });
        }
      });
    },

    onResetPasswordClicked: function(e) {
      Origin.Notify.confirm({
        text: Origin.l10n.t('app.confirmsendreset', { email: this.model.get('email') }),
        callback: result => {
          if (!result.isConfirmed) {
            return;
          }
          var $btn = $(e.currentTarget);
          $btn.addClass('submitted');
          Helpers.ajax('api/auth/local/forgotpass', { email: this.model.get('email') }, 'POST', () => {
            $btn.removeClass('submitted');
            Origin.Notify.alert({
              type: 'success',
              text: Origin.l10n.t('app.resetsent', { email: this.model.get('email') })
            });
          });
        }
      });
    },

    onChangePasswordClicked: function() {
      Origin.Notify.confirm({
        type: 'input',
        title: Origin.l10n.t('app.resetpasswordtitle'),
        text: Origin.l10n.t('app.resetpasswordinstruction', { email: this.model.get('email') }),
        inputType: 'password',
        confirmButtonText: 'Save',
        closeOnConfirm: false,
        callback: ({ isConfirmed, value: password }) => {
          if(!isConfirmed) return;
          else if(password === "") return swal.showInputError(Origin.l10n.t('app.invalidempty'));
          const email = this.model.get('email');
          Helpers.ajax('api/auth/local/changepass', { email, password }, 'POST', () => {
            this.model.fetch();
            Origin.Notify.alert({ type: 'success', text: Origin.l10n.t('app.changepasswordtext', { email }) });
          });
        }
      });
    },

    onDisableClicked: function() {
      this.updateModel('isEnabled', false);
    },

    onRestoreClicked: function() {
      this.updateModel('isEnabled', true);
    },

    onDeleteClicked: function() {
      var option = this.$('[name="delete-options"]').val();
      var optionMsg = {
        transfer: Origin.l10n.t('app.confirmdeleteusertransfer'),
        delete: Origin.l10n.t('app.confirmdeleteuserdelete'),
        share: Origin.l10n.t('app.confirmdeleteusershare')
      };
      Origin.Notify.confirm({
        type: 'confirm',
        text: Origin.l10n.t('app.confirmdeleteuser', {
          courseOption: optionMsg[option],
          email: this.model.get('email')
        }),
        callback: result => {
          if(!result.isConfirmed) return; 
          this.model.destroy({ 
            data: { userCourseOption: option }, 
            processData: true, 
            error: this.onError 
          });
        }
      });
    },

    updateModel: function(key, value) {
      if(this.model.get(key) === value) {
        return; // no point saving if there's no change
      }
      this.model.save({ [key]: value }, {
        patch: true,
        wait: true,
        error: (model, response)  => {
          if(response.responseJSON && response.responseJSON.code === 11000) { // duplicate key
            return this.onError(Origin.l10n.t('app.duplicateuservalueerror', { key, value }));
          }
          this.onError(`${Origin.l10n.t('app.uservalueerror')} (${response.responseText})`);
        }
      });
    },

    onError: function(error) {
      // HACK setTimeout workaround to give sweetalert time to clean up after a confirm
      setTimeout(() => Origin.Notify.alert({ type: 'error', text: error.message || error }), 100);
    }
  }, {
    template: 'user'
  });

  return UserView;
});
