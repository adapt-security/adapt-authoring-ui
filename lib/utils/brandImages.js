import path from 'node:path'

/**
 * Maps core's branding image config paths to their build destination and served
 * URL. Each configured image is copied into the UI build's assets dir and referenced
 * from a Handlebars page var or LESS `modifyVars`. Keys left unset are omitted, so the
 * built-in defaults stand. The source extension is preserved so the static server sets
 * the correct MIME type.
 * @param {Object} images Branding image paths from adapt-authoring-core config
 * @param {string} [images.favicon]
 * @param {string} [images.logo]
 * @param {string} [images.loginBackground]
 * @param {string} [images.projectPlaceholder]
 * @param {string} assetsDir Directory the assets are copied into
 * @param {string} [servedBase] URL base the assets are served from
 * @returns {Object} Map of config key to `{ src, dest, url }`
 * @memberof ui
 */
export function brandImages (images = {}, assetsDir = '', servedBase = '/css/assets') {
  const NAMES = {
    favicon: 'brand-favicon',
    logo: 'brand-logo',
    loginBackground: 'brand-login-background',
    projectPlaceholder: 'brand-project-placeholder'
  }
  return Object.entries(NAMES).reduce((out, [key, name]) => {
    const src = images[key]
    if (src) {
      const file = `${name}${path.extname(src)}`
      out[key] = { src, dest: `${assetsDir}/${file}`, url: `${servedBase}/${file}` }
    }
    return out
  }, {})
}
