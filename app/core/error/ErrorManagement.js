class ErrorManagement {
  initialize (Origin) {
    this.Origin = Origin
  }

  // check for data format errors in content
  async check () {
    if (!this.Origin.sessionModel.get('isAuthenticated')) return
    try {
      await $.ajax({
        url: 'api/content/check',
        type: 'get'
      })
    } catch (e) {
      return new Promise(resolve => {
        const msg = e.responseJSON?.message

        if (!msg) return

        const errorJson = JSON.parse(msg)
        const title = errorJson.title
        const text = errorJson.text
        const debugInfo = errorJson.data

        delete errorJson.title
        delete errorJson.text

        this.Origin.Notify.alert({
          title,
          html: `<p>${text}</p><pre>${JSON.stringify(debugInfo, undefined, 2)}</pre>`,
          callback: resolve,
          customClass: {
            popup: 'error-management'
          }
        })
      })
    }
  }
}

export default new ErrorManagement()
