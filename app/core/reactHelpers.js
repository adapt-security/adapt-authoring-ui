/**
 * Storage for react templates
 */
export const templates = {};

/**
 * Convert html strings to react dom, equivalent to handlebars {{{html}}}
 * @param {string} html
 * @deprecated since v6.0.4, please use react dangerouslySetInnerHTML instead: https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml
 */
export function html(html) {
  if (!html) return;
  console.warn('reactHelpers.html please use react dangerouslySetInnerHTML instead: https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml');
  return { __html: html };
}

/**
 * Handlebars compile integration
 * @param {string} name Handlebars template
 * @param {...any} args Template arguments
 */
export function compile(template, ...args) {
  const output = Handlebars.compile(template)(...args);
  return output;
};

/**
 * Handlebars partials integration
 * @param {string} name Partial name
 * @param {...any} args Partial arguments
 */
export function partial(name, ...args) {
  const output = Handlebars.partials[name](...args);
  return output;
};

/**
 * Handlebars helpers integration
 * @param {string} name Helper name
 * @param {...any} args Helper arguments
 */
export function helper(name, ...args) {
  const output = Handlebars.helpers[name].call(this ?? args[0], args[0]);
  return (output && output.string) || output;
};

/**
 * Helper for a list of classes, filtering out falsies and duplicates, and joining with spaces
 * @param  {...any} args List or arrays of classes
 */
export function classes(...args) {
  return _.uniq(_.flatten(args).filter(Boolean).join(' ').split(' ')).join(' ');
};

/**
 * Helper for prefixing a list of classes, filtering out falsies and duplicates and joining with spaces
 * @param  {[...string]} prefixes Array of class prefixes
 * @param  {...any} args List or arrays of classes
 */
export function prefixClasses(prefixes, ...args) {
  const classes = _.flatten(args).filter(Boolean);
  const prefixed = _.flatten(prefixes.map(prefix => classes.map(className => `${prefix}${className}`)));
  return _.uniq(prefixed.join(' ').split(' ')).join(' ');
};
