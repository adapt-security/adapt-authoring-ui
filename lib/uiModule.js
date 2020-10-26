const { AbstractModule } = require('adapt-authoring-core');
const path = require('path');
/**
 * The main entry-point for the Adapt authoring tool web-app/front-end
 * @extends {AbstractModule}
 */
class UIModule extends AbstractModule {
  /** @override */
  async init() {
    const server = await this.app.waitForModule('server');
    server.root
      .addMiddleware(server.static(path.join(__dirname, '..', 'build')))
      .addMiddleware(server.static(path.join(__dirname, '..', 'app', 'libraries')))
      .addRoute({ route: '/', handlers: { get: this.servePage('index') } })
      .addRoute({ route: '/loading', handlers: { get: this.servePage('loading') } });
  }
  servePage(pageName) {
    return (req, res, next) => res.render(path.join(__dirname, `../app/core/${pageName}`));
  }
}

module.exports = UIModule;
