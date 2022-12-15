define(['core/origin', './views/appHeaderView'], function(Origin, AppHeaderView) {
  Origin.once('origin:dataReady', function() {
    $('#app').before(new AppHeaderView({ model: Origin.sessionModel }).$el);
  });
});
