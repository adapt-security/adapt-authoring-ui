/**
 * Maps core's branding colours onto the theme's editable LESS variables for use
 * as Less `modifyVars`. Colours left unset are omitted, so the defaults defined in
 * colours.less stand.
 * @param {Object} colours Branding colours from adapt-authoring-core config
 * @param {string} [colours.primaryColour]
 * @param {string} [colours.commitColour]
 * @param {string} [colours.chromeColour]
 * @param {string} [colours.accentColour]
 * @returns {Object} Map of LESS variable name to colour value
 * @memberof ui
 */
export function brandColours (colours = {}) {
  const LESS_VARS = {
    primaryColour: '@primary-color',
    commitColour: '@secondary-color',
    chromeColour: '@tertiary-color',
    accentColour: '@quaternary-color'
  }
  return Object.entries(LESS_VARS).reduce((vars, [key, lessVar]) => {
    if (colours[key]) vars[lessVar] = colours[key]
    return vars
  }, {})
}
