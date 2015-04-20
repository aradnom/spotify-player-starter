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
