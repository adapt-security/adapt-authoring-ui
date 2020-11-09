// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'core/collections/apiCollection', 
  '../models/assetModel'
], function(ApiCollection, AssetModel) {
  var AssetCollection = ApiCollection.extend({
    model: AssetModel,
    url: 'api/assets',

    dateComparator: function(m) {
      return -m.get('lastUpdated').getTime();
    }
  });

  return AssetCollection;
});
