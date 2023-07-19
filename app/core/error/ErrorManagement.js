class ErrorManagement {
  initialize(Origin) {
    this.Origin = Origin
  }
  async check() {
    if (!this.Origin.sessionModel.get('isAuthenticated')) return;
    try {
      await $.ajax({
        url: 'api/content/check',
        type: 'get'
      })
    } catch (e) {
      return new Promise(async resolve => {
        const errorJson = JSON.parse(e.responseJSON.message);
        const title = errorJson.title;
        const text = errorJson.text;
        const debugInfo = errorJson.data;

        delete errorJson.title;
        delete errorJson.text;

        this.Origin.Notify.alert({
          title,
          html: `<p>${text}</p><pre>${JSON.stringify(debugInfo, undefined, 2)}</pre>`,
          callback: resolve
        })
      });
    }
  }
}

export default new ErrorManagement()