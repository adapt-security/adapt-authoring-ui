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

        if (typeof msg !== 'string') {
          console.error('Server returned unexpected error string:', msg)
          return
        }

        let errorJson
        try {
          errorJson = JSON.parse(msg)
        } catch (e) {
          this.Origin.Notify.alert({
            title: this.Origin.l10n.t('app.errormanagementtitle'),
            text: msg,
            callback: resolve,
            customClass: {
              popup: 'error-management'
            }
          })

          return
        }

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
