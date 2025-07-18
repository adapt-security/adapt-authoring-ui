// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['handlebars', 'moment', 'core/origin'], function(Handlebars, Moment, Origin) {
  var helpers = {
    console: function(context) {
      return console.log(context);
    },

    lowerCase: function(text) {
      return text.toLowerCase();
    },

    numbers: function(index) {
      return index+1;
    },

    capitalise:  function(text) {
      return text.charAt(0).toUpperCase() + text.slice(1);
    },

    odd: function (index) {
      return (index +1) % 2 === 0  ? 'even' : 'odd';
    },

    stringToClassName: function(text) {
      if (!text) return;
      // Check if first character is an underscore and remove
      // Normally used for attribute with '_'s
      if (text.slice(1) === '_') {
        text = text.slice(1);
      }
      // Remove _ and spaces with dashes
      return text.replace(/_| /g, "-").toLowerCase();
    },

    keyToTitleString: function(key) {
      if (!key) return;
      // check translatable strings first
      var l10nKey = 'app.scaffold.' + key;
      if(Origin.l10n.has(l10nKey)) {
        return Origin.l10n.t(l10nKey);
      }
      // fall-back: remove all _ and capitalise
      var string = key.replace(/_/g, '').replace(/[A-Z]/g, ' $&').toLowerCase();
      return this.capitalise(string);
    },

    momentFormat: function(date, format) {
      if (typeof date == 'undefined') {
        return '-';
      }
      return Moment(date).format(format);
    },

    timestring: function(date) {
      return new Date(date).getTime();
    },

    formatDuration: function(duration) {
      var zero = '0', hh, mm, ss;
      var time = new Date(0, 0, 0, 0, 0, Math.floor(duration), 0);

      hh = time.getHours();
      mm = time.getMinutes();
      ss = time.getSeconds();

      // Pad zero values to 00
      hh = (zero+hh).slice(-2);
      mm = (zero+mm).slice(-2);
      ss = (zero+ss).slice(-2);

      return `${hh}:${mm}:${ss}`;
    },

    // checks for http/https and www. prefix
    isAssetExternal: function(url) {
      if (!url || !url.length) {
        return true;
      }
      var urlRegEx = new RegExp(/^(https?:\/\/)|^(www\.)/);
      return url.match(urlRegEx) !== null;
    },

    ifValueEquals: function(value, text, block) {
      return (value === text) ? block.fn(this) : block.inverse(this);
    },
    
    ifArrayIncludes: function(value, text, block) {
      return value.includes(text) ? block.fn(this) : block.inverse(this);
    },

    ifUserIsMe: function(userId, block) {
      var isMe = userId === Origin.sessionModel.get('id');
      return isMe ? block.fn(this) : block.inverse(this);
    },

    selected: function(option, value){
      return (option === value) ? ' selected' : '';
    },

    counterFromZero: function(n, block) {
      var sum = '';
      for (var i = 0; i <= n; ++i) sum += block.fn(i);
      return sum;
    },

    counterFromOne: function(n, block) {
      var sum = '';
      for (var i = 1; i <= n; ++i) sum += block.fn(i);
      return sum;
    },

    t: function(str, options) {
      for (var placeholder in options.hash) {
        options[placeholder] = options.hash[placeholder];
      }
      return Origin.l10n.t(str, options);
    },

    stripHtml: function(html) {
      return new Handlebars.SafeString(html);
    },

    escapeText: function(text) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(text));
      return div.innerHTML;
    },

    bytesToSize: function(bytes) {
      if (bytes === 0) return '0 B';

      var k = 1000;
      var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      var i = Math.floor(Math.log(bytes) / Math.log(k));

      return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    },

    renderBooleanOptions: function(selectedValue) {
      const html = val => `<option value="${val}"${selectedValue === val ? ' selected' : ''}>${val}</option>`;
      return `${html(true)}${html(false)}`;
    },

    pickCSV: function(list, key, separator) {
      if (!list || !list.length) {
        return '';
      }
      if (!separator || !separator.length) {
        separator = ',';
      }
      var vals = list.map(l => (key && val[key] )|| val);
      return vals.join(separator);
    },

    renderTags: function(list, key) {
      if (!list || !list.length) {
        return '';
      }
      var html = '<ul class="tag-container">';
      for (var i = 0; i < list.length; ++i) {
        var item = list[i];
        var tag = Handlebars.Utils.escapeExpression(key && item[key] || item);
        html += `<li class="tag-item" title="${tag}"><span class="tag-value">${tag}</span></li>`;
      }
      return new Handlebars.SafeString(`${html}</ul>`);
    },

    ifHasScopes: function(scopes, block) {
      return Origin.sessionModel.hasScopes(scopes.split(',')) ? block.fn(this) : block.inverse(this);
    },

    ifMailEnabled: function(block) {
      return Origin.constants['adapt-authoring-mailer.isEnabled'] === true ? block.fn(this) : block.inverse(this);
    },

    ifAssetIsExternal: function(url, block) {
      var isExternal = Handlebars.helpers.isAssetExternal(url);
      return isExternal ? block.fn(this) : block.inverse(this);
    },

    ifAssetIsHeroImage: function(url, block) {
      var isMultiPart = url.split('/').length === 1;
      return isMultiPart ? block.fn(this) : block.inverse(this);
    },

    copyStringToClipboard: function(data) {
      var textArea = document.createElement("textarea");

      textArea.value = data;
      // Place in top-left corner of screen regardless of scroll position.
      textArea.style.position = 'fixed';
      textArea.style.top = 0;
      textArea.style.left = 0;
      // Ensure it has a small width and height. Setting to 1px / 1em
      // doesn't work as this gives a negative w/h on some browsers.
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      // We don't need padding, reducing the size if it does flash render.
      textArea.style.padding = 0;
      // Clean up any borders.
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      // Avoid flash of white box if rendered for any reason.
      textArea.style.background = 'transparent';

      document.body.appendChild(textArea);

      textArea.select();

      var success = document.execCommand('copy');

      document.body.removeChild(textArea);

      return success;
    },

    isValidEmail: function(value) {
      var regEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return value.length > 0 && regEx.test(value);
    },

    contentModelMap: function(type) {
      var contentModels = {
        course: 'core/models/courseModel',
        contentobject: 'core/models/contentObjectModel',
        article: 'core/models/articleModel',
        block: 'core/models/blockModel',
        component: 'core/models/componentModel'
      };
      if(contentModels.hasOwnProperty(type)) {
        return require(contentModels[type]);
      }
    },

    // Ensures list is iterated (doesn't guarantee order), even if using async iterator
    // @param list Array or Backbone.Collection
    // @param func Function to use as iterator. Will be passed item, index and callback function
    // @param callback Function to be called on completion
    forParallelAsync: function(list, func, callback) {
      if(!list.hasOwnProperty('length') || list.length === 0) {
        if(typeof callback === 'function') callback();
        return;
      }
      // make a copy in case func modifies the original
      var listCopy = list.models ? list.models.slice() : list.slice();
      var doneCount = 0;
      var _checkCompletion = function() {
        if((++doneCount === listCopy.length) && typeof callback === 'function') {
          callback();
        }
      };
      for(var i = 0, count = listCopy.length; i < count; i++) {
        func(listCopy[i], i, _checkCompletion);
      }
    },

    // Does a fetch for model in models, and returns the latest data in the
    // passed callback
    // @param models {Array of Backbone.Models}
    // @param callback {Function to call when complete}
    multiModelFetch: function(models, callback) {
      var collatedData = {};
      helpers.forParallelAsync(models, function(model, index, done) {
        model.fetch({
          success: function(data) {
            collatedData[index] = data;
            done();
          },
          error: function(data) {
            console.error('Failed to fetch data for', model.get('_id'), + data.responseText);
            done();
          }
        });
      }, function doneAll() {
        var orderedKeys = Object.keys(collatedData).sort();
        var returnArr = [];
        for(var i = 0, count = orderedKeys.length; i < count; i++) {
          returnArr.push(collatedData[orderedKeys[i]]);
        }
        callback(returnArr);
      });
    },

    maxUploadSize: function(options) {
      const sizeInB = Origin.constants['adapt-authoring-middleware.fileUploadMaxFileSize'];
      const multiplier = 0.00000095367432;
      return new Handlebars.SafeString([
        '<span class="max-fileupload-size">',
        Origin.l10n.t('app.maxfileuploadsize', { size: `${Math.round(sizeInB*multiplier)}MB` }),
        '</span>'].join(''))
    },

    flattenNestedProperties: function(properties) {
      if (!properties) return {};
      var flatProperties = {};
      for (var key in properties) {
        // Check for nested properties
        if (typeof properties[key] === 'object') {
          for (var innerKey in properties[key]) {
            // Check if key already exists
            if (flatProperties[innerKey]) {
              flatProperties[key+'.'+innerKey] = properties[key][innerKey];
            } else {
              flatProperties[innerKey] = properties[key][innerKey];
            }
          }
        } else {
          flatProperties[key] = properties[key];
        }
      }
      return flatProperties;
    },

    importConstants: function() {
      this.constants = Origin.constants;
      return '';
    },
    // Comparison operator (ifValueEquals left for compatibility)
    when: (a, operator, b, block) => {
      console.log(a, operator, b);
      const ops = {
        eq: (l,r) => l === r,
        noteq: (l,r) => l !== r,
        gt: (l,r) => Number(l) > Number(r),
        or: (l,r) => l || r,
        and: (l,r) => l && r
      };
      return ops[operator](a, b) ? block.fn(this) : block.inverse(this);
    },

    sortContentObjects: (a, b) => {
      const soA = a._sortOrder || a.get('_sortOrder');
      const soB = b._sortOrder || b.get('_sortOrder');
      return soA > soB ? 1 : -1;
    },

    submitForm($form, options = {}) {
      return new Promise(async (resolve, reject) => {
        const body = new FormData($form[0]);
        if(options.extendedData) Object.entries(options.extendedData).forEach(([attr, val]) => body.append(attr, val));
        const res = await fetch($form.attr('action'), { method: $form.attr('method'), body });
        if(res.status === 204) {
          return resolve();
        }
        const data = await res.json();
        if(res.status > 299) {
          return reject(data);
        }
        resolve(data);
      });
    },

    parseLinksHeader(res) {
      const header = res.xhr.getResponseHeader('Link');
      const links = {};
      if(header) {
        header.split(',').forEach(l => {
          const [url, name] = l.split(';');
          if (!url || !name) return console.error(`Could not parse links: ${l}`);
          links[name.replace(/rel="(.*)"/, '$1').trim()] = url.replace(/<(.*)>/, '$1').trim();
        });
      }
      return links;
    }
  }

  for(var name in helpers) {
    if(helpers.hasOwnProperty(name)) {
      Handlebars.registerHelper(name, helpers[name]);
    }
  }

  return helpers;
});
