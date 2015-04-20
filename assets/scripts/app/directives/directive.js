'use strict';

App.directive('directive', ['$', function($) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      // Do directive things!
    }
  };
}]);
