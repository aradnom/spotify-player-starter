'use strict';

// Declare app level module which depends on filters, and services
var App = angular.module('App', [ 'ngSanitize', 'ngResource', 'spotify' ]);

/**
 * App-wide config(s).
 */

// Spotify config
App.value( 'spotifyConfig', {
  spotifyHelperUrl: 'https://pnmxtktyhx.spotilocal.com:4371/remote/'
});

/**
 * Retrieve necessary tokens to talk to the Spotify web helper (CSRF and OAuth
 * Access tokens)
 */
App.service( 'getTokens', [ '$http', '$q', function ( $http, $q ) {
  var deferred = $q.defer();

  $http.jsonp( '/api/auth/gettokens', {
      params: { callback: 'JSON_CALLBACK' }
    })
    .success( function ( data, status, headers, config ) {
      if ( data && data.success ) {
        // And back we go
        deferred.resolve( data.tokens );
      } else {
        deferred.reject( data.error );
      }
    })
    .error( function ( data, status, headers, config ) {
      deferred.reject( 'Unable to fetch Spotify tokens.' );
    });

  return deferred.promise;
}]);

/**
 * Provides access to the Spotify Web Helper server.  This allows access to the
 * following commands:
 *
 * - Play Spotify resource (track, playlist, etc.)
 * - Pause player
 * - Get player status
 *
 * This requires a valid CSRF token and OAuth Access token.  These are
 * retrieved with a separate service and require the Spotify Web Helper to be
 * active on the browser machine.
 */
App.service( 'spotifyHelper', [ '$http', '$q', 'getTokens', '$rootScope', 'templates', function ( $http, $q, getTokens, $rootScope, templates ) {
  var tokens = {};

  // Attempt to retrieve necessary tokens
  getTokens
    .then( function ( spotifyTokens ) {
      tokens = spotifyTokens;

      // Great, spread the good news
      $rootScope.$broadcast( 'spotifyHelperLoaded' );
    })
    .catch( function ( error ) {
      console.error( error );

      $rootScope.$broadcast( 'spotifyHelperError' );
    });

  return {
    play: function ( resource ) {
      if ( tokens.csrf && tokens.access && resource ) {
        // Build the command URL
        var url = buildSpotifyCommandUrl({
          action: 'play',
          csrf: tokens.csrf,
          oauth: tokens.access,
          suffix: 'uri=' + resource + '&context=' + resource
        });

        // Issue the command - will return a promise containing service
        // response on success or error on fail
        return sendSpotifyCommand( url );
      } else {
        console.error( 'Spotify Helper must be loaded before issuing commands.' );
      }
    },

    pause: function () {
      if ( tokens.csrf && tokens.access ) {
        // Build the command URL
        var url = buildSpotifyCommandUrl({
          action: 'pause',
          csrf: tokens.csrf,
          oauth: tokens.access,
          suffix: 'pause=true'
        });

        // Issue the command - will return a promise containing service
        // response on success or error on fail
        return sendSpotifyCommand( url );
      } else {
        console.error( 'Spotify Helper must be loaded before issuing commands.' );
      }
    },

    status: function () {
      if ( tokens.csrf && tokens.access ) {
        // Build the command URL
        var url = buildSpotifyCommandUrl({
          action: 'status',
          csrf: tokens.csrf,
          oauth: tokens.access,
          suffix: 'returnon=login,logout,play,pause,error,ap&returnafter=60'
        });

        // Issue the command - will return a promise containing service
        // response on success or error on fail
        return sendSpotifyCommand( url );
      } else {
        console.error( 'Spotify Helper must be loaded before issuing commands.' );
      }
    }
  };


  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  function buildSpotifyCommandUrl ( args ) {
    var compiler = _.template( templates.spotifyCommandUrl );

    return encodeURI( compiler( args ) );
  }

  function sendSpotifyCommand ( url ) {
    var deferred = $q.defer();

    $http.get( url, {
        params: { callback: 'JSON_CALLBACK' }
      })
      .success( function ( data, status, headers, config ) {
        deferred.resolve( data );
      })
      .error( function ( data, status, headers, config ) {
        deferred.reject( 'Unable to send Spotify command.' );
      });

    return deferred.promise;
  }

  /**
   * So... commands to the HTTP service return what is basically JSON, but
   * without a few essential bits.  For convenience, this just adds those bits
   * back in so you've got a normal JS object to play with.
   *
   * EDIT: never mind, discovered a JSON route. Tee hee.
   *
   * @param  {String}  data Raw unformatted response string
   * @return {Objects}      Returns parsed JSON if possible or unparsed data if
   * not
   */
  function buildResponseJson ( data ) {
    var parsed = data;

    parsed = parsed.replace( /([a-z|A-Z|\d|'|"|\}])\n/g, '$1,\n' );
    parsed = parsed.replace( /\s\{/g, ': {' );
    parsed = parsed.replace( /([a-z|A-Z|_]+):\s/g, '"$1": ' );
    parsed = parsed.replace( /,\n(\s*\})/g, '$1' );
    parsed = '{\n' + parsed + '\n}';

    try {
      parsed = JSON.parse( parsed );

      return parsed;
    } catch ( e ) {
      return data;
    }
  }
}]);

/**
 * Global object for simple Underscore templates.
 */
App.service( 'templates', [ 'spotifyConfig', function ( spotifyConfig ) {
  return {
    spotifyCommandUrl: spotifyConfig.spotifyHelperUrl + '<%= action %>.json?csrf=<%= csrf %>&oauth=<%= oauth %>&<%= suffix %>&ref=&cors'
  };
}]);

/**
 * Body-level controller for anything site-wide.
 */
App.controller( 'Main', [ '$scope', '$element', 'spotifyHelper', '$timeout', function ( $scope, $element, spotifyHelper, $timeout ) {
  $scope.$on( 'spotifyHelperLoaded', function () {
    // Play a track
    console.log( 'Starting playback...' );

    spotifyHelper.play( 'spotify:track:6qIhYlaLt0ra6YohxThTqi' );

    // Pull the status after a bit
    $timeout( function () {
      console.log( 'Pulling playback status...' );

      spotifyHelper.status()
        .then( function ( status ) {
          console.log( status );
        });
    }, 2500 );

    // After another bit, pause it
    $timeout( function () {
      console.log( 'Pausing playback...' );

      spotifyHelper.pause();
    }, 5000 );
  });
}]);

'use strict';

App.directive('directive', ['$', function($) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      // Do directive things!
    }
  };
}]);
