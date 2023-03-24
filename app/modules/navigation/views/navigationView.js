import React from 'react';
import ReactDOM from 'react-dom';
import OriginView from 'core/views/originView';
import Origin from 'core/origin';
import NavigationJsx from './navigation.jsx';

export default class NavigationView extends OriginView {

  initialize() {
    this.listenTo(Origin, 'login:changed', this.loginChanged);
    this.render();
  }

  events() {
    return {
      'click a.navigation-item':'onNavigationItemClicked'
    }
  }

  render() {
    if (!Origin.sessionModel.get('isAuthenticated')) return;

    this.changed();

    _.defer(_.bind(function() {
      this.postRender();
      this.onReady();
      Origin.trigger('navigation:postRender', this);
    }, this));
    return;
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
    ReactDOM.render(<NavigationJsx {...props} />, this.el);
  }

  loginChanged() {
    this.render();
  }

  onNavigationItemClicked(event) {
    event.preventDefault();
    event.stopPropagation();
    Origin.trigger('navigation:' + $(event.currentTarget).attr('data-event'));
  }
}
