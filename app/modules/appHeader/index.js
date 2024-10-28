define(['core/origin', './views/appHeaderView'], function(Origin, AppHeaderView) {
  Origin.once('origin:dataReady', function() {
    var view = new AppHeaderView({ model: Origin.sessionModel })
    $('#app').before(view.$el);
    $(Handlebars.templates.loadingSubtle()).insertAfter(view.$el)
  });
});
