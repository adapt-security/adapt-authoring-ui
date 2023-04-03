import React from 'react';
import ReactDOM from 'react-dom';
import OriginView from 'core/views/originView';
import Origin from 'core/origin';
import AppHeader from './appHeader';

export default class AppHeaderView extends OriginView {

  initialize() {
    this.listenTo(Origin, 'login:changed', this.loginChanged);
    this.listenTo(Origin, 'help', this.onHelpClicked);
    this.render();
  }

  events() {
    return {
      'click a.appHeader-item':'onItemClicked'
    }
  }

  render() {
    if (!Origin.sessionModel.get('isAuthenticated')) return;

    this.changed();

    _.defer(_.bind(function() {
      this.postRender();
      this.onReady();
      Origin.trigger('appHeader:postRender', this);
    }, this));
  }

  changed(eventName = null) {
    if (typeof eventName === 'string' && eventName.startsWith('bubble')) {
      // Ignore bubbling events as they are outside of this view's scope
      return;
    }
    const props = {
      // Add view own properties, bound functions etc
      ...this,
      // Add model json data
      ...this.model.toJSON()
    };
    ReactDOM.render(<AppHeader {...props} />, this.el);
  }

  loginChanged() {
    this.render();
  }

  getWikiPage() {
    const page = 'Creating-a-Course#';

    switch (Origin.location.module) {
      case 'assetManagement': return 'Asset-Management';
      case 'pluginManagement': return 'Plugin-Management';
      case 'projects': return 'The-Dashboard';
      case 'project': return 'Creating-a-Course#course-details';
      case 'userManagement': return 'User-Management';
      case 'editor':
        
        switch (Origin.location.route2) {
          case 'block': return `${page}adding-content-to-the-course`;
          case 'config': return `${page}course-settings`;
          case 'edit': return `${page}sectionpage-settings`;
          case 'extensions': return `${page}course-settings`;
          case 'menu': return `${page}editing-course-details`;
          case 'page': return `${page}adding-content-to-the-course`;
          case 'theme': return `${page}course-settings`;
        }
    }
  }

  onHelpClicked() {
    window.open(Origin.constants.supportLink || `https://github.com/adaptlearning/adapt_authoring/wiki/${this.getWikiPage()}`);
  }

  onItemClicked(event) {
    event.preventDefault();
    event.stopPropagation();
    Origin.trigger($(event.currentTarget).attr('data-event'));
  }
}
