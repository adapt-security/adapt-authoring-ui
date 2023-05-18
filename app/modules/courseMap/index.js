import Origin from 'core/origin';
import React from 'react';
import ReactDOM from 'react-dom';
import CourseMap from './CourseMap';
import ContentModel from 'core/models/contentModel';

class CourseMapController extends Backbone.Controller {
  initialize() {
    window.courseMap = this;
    this.transientModels = [];
    this.diff = this.diff.bind(this);
    this.logDiff = this.logDiff.bind(this);
    this.debouncedPushHistory = _.debounce(() => this.pushHistory(), 100);
    this.listenTo(Origin, {
      'contentModel:created': this.onModelCreated,
      'courseMap:load': this.onMapLoad,
      'editorData:loaded': this.onDataLoaded,
      'remove:views': this.onRemoveViews,
      'router:editor': this.onRouterEditor
    });
    this.courseMapWindow = window.open('coursemap.html', 'Course Map');
    this.history = [];
  }

  render() {
    if (!this.courseMapWindow) console.warn('courseMap window not available (check popup blocker)');
    this.changed();
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
      /* ...this.model.toJSON() */
    };
    ReactDOM.render(<CourseMap {...props} />, this.courseMapWindow.document.getElementById('map'));
  }

  onMapLoad() {
    function copyStyles(src, dest) {
      Array.from(src.styleSheets).forEach(styleSheet => {
          dest.head.appendChild(styleSheet.ownerNode.cloneNode(true))
      })
      //Array.from(src.fonts).forEach(font => dest.fonts.add(font))
    }
    copyStyles(window.document, this.courseMapWindow.document);
    this.render();
  }

  onDataLoaded(wasModified) {
    if (wasModified===false) return;
    const newContent = Origin.editor.data.content;
    const shouldPushHistory = !this.history.length || this.isDifferent(_.last(this.history), newContent);
    this.removeContentListeners();
    this.content = newContent;
    this.addContentListeners();
    if (shouldPushHistory) {
      this.pushHistory()
    }
  }

  isDifferent(left, right) {
    if (!left || !right) return;
    const { added, removed, changed } = this.diff(left, right);
    this.logDiff(left, added, removed, changed);
    return added.length || removed.length || changed.length;
  }

  diff(left, right) {
    if (!left || !right) return;
     
    let added = right.reduce((prev, current) => {
      const fromLeft = left.find(m => m.get('_id') === current.get('_id'));
      if (!fromLeft) prev.push(current);
      return prev;
    }, []);

    let removed = left.reduce((prev, current) => {
      const fromRight = right.find(m => m.get('_id') === current.get('_id'));
      if (!fromRight) prev.push(current);
      return prev;
    }, []);

    let changed = left.reduce((prev, current) => {
      const fromRight = right.find(m => m.get('_id') === current.get('_id'));
      if (fromRight && current.get('updatedAt') !== fromRight.get('updatedAt')) prev.push(fromRight);
      return prev;
    }, []);

    return {added, removed, changed};
  }

  logDiff(left, added, removed, changed, output = window) {
    output.console.warn('courseMap::diff');

    added.forEach(m => output.console.log('courseMap::diff added', m.get('_type'), m.get('_id')));
    removed.forEach(m => output.console.log('courseMap::diff removed', m.get('_type'), m.get('_id')));
    changed.forEach(m => {
      const fromLeft = left.find(l => l.get('_id') === m.get('_id'));
      output.console.log('courseMap::diff changed', m.get('_type'), m.get('_id'), this.getObjectDiff(fromLeft.attributes, m.attributes))
    });
  }

  addContentListeners() {
    // nothing is ever added to the content collection
    // model changes are pushed and result in collection being re-created
    // we only care above models that are removed
    this.listenTo(this.content, 'remove', this.onContentRemoved);
    this.listenTo(this.content, 'sync', this.onContentSync);
  }

  removeContentListeners() {
    if (!this.content) return;
    this.stopListening(this.content, 'remove', this.onContentRemoved);
    this.stopListening(this.content, 'sync', this.onContentSync);
  }

  pushHistory() {
    console.log('courseMap::pushHistory');
    this.history.push(this.cloneContent(Origin.editor.data.content));
    this.render();
  }

  onContentRemoved(m) {
    // remove is triggered if the model is successfully destroyed on the server
    // Origin.editor.data.content is not updated on component/block/article remove so we must push history
    console.log('courseMap::onContentRemoved', m.get('_type'));
    this.pushHistory();
  }

  onContentSync() {
    const shouldPushHistory = !this.history.length || this.isDifferent(_.last(this.history), this.content);
    
    if (shouldPushHistory) {
      this.pushHistory()
    }
  }

  onModelCreated(m) {
    // new block/article models will be referenced by their corresponding views
    // cloned models of the same data will be present in Origin.editor.data.content
    // if the user deletes the new block/article the new model is destroyed rather than the clone
    if (!m.isNew()) return;
    if (m.get('_type')==='course') return;
    console.log('courseMap transient', m.get('_type'), 'created');
    this.transientModels.push(m);
    this.listenTo(m, 'destroy', this.onTransientModelDestroyed);
  }

  onTransientModelDestroyed(m) {
    console.log('courseMap transient', m.get('_type'), 'destroyed', m.get('_id'));
    this.stopListening(m, 'destroy', this.onTransientModelDestroyed);
    this.transientModels.splice(this.transientModels.indexOf(m), 1);
    this.pushHistory();
  }

  onRemoveViews() {
    this.removeTransients();
  }

  onRouterEditor(courseId) {
    // TODO if courseId different then do below...
    /* this.removeTransients();
    this.history = []; */
  }

  removeTransients() {
    this.transientModels.forEach(m => {
      this.stopListening(m, 'destroy', this.onTransientModelDestroyed);
    });
    this.transientModels = [];
  }

  cloneContent(content) {
    return new Backbone.Collection(content.map(m => {
      const newModel = new ContentModel(m.toJSON());
      newModel.urlRoot = null;
      return newModel
    }))
  }

  getObjectDiff(obj1, obj2) {
    const diff = Object.keys(obj1).reduce((result, key) => {
        if (!obj2.hasOwnProperty(key)) {
            result.push(key);
        } else if (_.isEqual(obj1[key], obj2[key])) {
            const resultKeyIndex = result.indexOf(key);
            result.splice(resultKeyIndex, 1);
        }
        return result;
    }, Object.keys(obj2));

    return diff;
  }
}

export default (new CourseMapController())