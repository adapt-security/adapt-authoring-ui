// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  let Origin;

  var userData = false;

  class BrowserStorage {
    constructor(origin) {
      Origin = origin;
      Origin.on('origin:dataReady login:changed', this.initialise.bind(this));
    }
    initialise() {
      // don't bother doing anything if there's no storage
      if(!Storage) return;

      var userId = Origin.sessionModel.get('id');
      userData = {
        local: JSON.parse(localStorage.getItem(userId)) || {},
        session: JSON.parse(sessionStorage.getItem(userId)) || {}
      };
    }
    set(key, value, sessionOnly, replaceExisting) {
      // determine what we're storing, and where
      var storageObj = sessionOnly ? userData.session : userData.local;
      storageObj[key] = replaceExisting ? value : _.extend({}, storageObj[key], value);
      this.save();
    }
    get(key) {
      return _.extend({}, userData.local[key], userData.session[key]);
    }
    // persist data to Storage
    save() {
      var userId = Origin.sessionModel.get('id');

      if(!_.isEmpty(userData.session)) {
        sessionStorage.setItem(userId, JSON.stringify(userData.session));
      }
      if(!_.isEmpty(userData.local)) {
        localStorage.setItem(userId, JSON.stringify(userData.local));
      }
    }
  };
  return BrowserStorage;
});
