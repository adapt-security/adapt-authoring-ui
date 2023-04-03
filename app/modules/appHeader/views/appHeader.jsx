import React from 'react';
import Origin from 'core/origin';

export default function AppHeader (props) {

const {
  user
} = props;

return (
  <nav className="appHeader">
    <div className="appHeader-bg"></div>
    <div className="appHeader-inner clearfix">
      <div className="appHeader-left">
        <div href="#" className="appHeader-item appHeader-product-name">{Origin.l10n.t('app.productname')}</div>
      </div>
      <div className="appHeader-right">
        <a href="#" className="appHeader-item appHeader-help" data-event="help">
          <span>{Origin.l10n.t('app.help')}</span>
        </a>
        <a href="#" className="appHeader-item appHeader-profile" data-event="user:profile">
        {Origin.l10n.t('app.help')}: <span>{user.email}</span>
        </a>
        <a href="#" className="appHeader-item appHeader-user-logout btn white-hollow" data-event="user:logout">
          <span>{Origin.l10n.t('app.logout')}</span>
        </a>
      </div>
    </div>
  </nav>
)}