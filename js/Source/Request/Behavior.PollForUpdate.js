/*
---

name: Behavior.PollForUpdate

description: Behavior that polls a URL and runs delegators and actions upon an update response.

requires:
 - Request.PollForUpdate
 - Behavior/Behavior
 - Behavior/Delegator.verifyTargets

provides: [Behavior.PollForUpdate]

...
*/
(function(){
  Behavior.addGlobalFilter('PollForUpdate', {

    requireAs: {
      url: String,
      date: Number
    },

    defaults: {
      haltOnError: false
    },

    returns: Request.PollForUpdate,

    setup: function(el, api){
      // instantiate the pollForUpdate object and start polling
      var pollForUpdate = new Request.PollForUpdate({
        url: api.get('url'),
        date: api.get('date'),
        pollInterval: api.get('pollInterval') || 60000,
        haltOnError: api.getAs(Boolean, 'haltOnError')
      }).poll();

      var target = api.get('target') ? api.getElement('target') : null;
      var dataKey = api.get('dataKey');

      // if this is enabled, when the element is clicked we send the 'updatedAt'
      // instead of the 'date'. this way, we can only update the date that we
      // are comparing on the server after user interaction.
      if (api.get('updateDateOnClick')){
        el.addEvent('click', function(){
          pollForUpdate.data.date = pollForUpdate.updatedAt;
        });
      }

      //get the delegators and actions to call
      var delegators = api.get('delegators');
      var actions = api.get('actions');

      // when we detect an update from the server, run any delegators we've specified
      // and update the target's html with data[dataKey] (if specified)
      pollForUpdate.addEvent('update', function(data){
        if (target && dataKey){
          if (data[dataKey]){
            api.fireEvent('destroyDom', target);
            target.set('html', data[dataKey]);
            api.fireEvent('ammendDom', target);
          } else {
            api.error('Could not find the specified dataKey (' + dataKey + ') in the data returned from the server.');
          }
        }
        if (delegators){
          Object.each(delegators, function(delegatorOptions, delegator){
            if (Delegator.verifyTargets(el, delegatorOptions, api)){
              api.getDelegator().trigger(delegator, el);
            }
          });
        }
      });
      api.onCleanup(function(){
        pollForUpdate.stop();
      });
      return pollForUpdate;
    }
  });
})();
