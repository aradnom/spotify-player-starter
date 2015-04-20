/******************************************************************************
* BASIC EXPRESS APP ***********************************************************
******************************************************************************/

///////////////////////////////////////////////////////////////////////////////
// Requires ///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

var Express     = require( 'express' ),
    Compression = require( 'compression' ),
    Path        = require( 'path' ),
    Minify      = require( 'minify' ), // TODO - render with minify
    _           = require( 'underscore' ),
    Winston     = require( 'winston' ),
    Args        = require( 'yargs' ).argv,
	  App         = Express();

////////////////////////////////////////////////////////////////////////
// Setup ///////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

var config      = require( './lib/config/config.js' ),
    logger = SetupLogger();

// Figure out if this is a production or dev environment
var env = Args.env ? Args.env : config.environment;

// Route controllers //////////////////////////////////////////////////////////
var api = require( './lib/controllers/api.js' );

///////////////////////////////////////////////////////////////////////////////
// Express configuration //////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Set up configuration for production vs. dev - dev is assumed if
// production isn't set
if ( env == 'production' ) {
    App.locals.pretty = false;
    App.use( Compression() );

    // Production includes
    var assets = {
        stylesheet: '/assets/styles/application.min.css',
        vendors: '/assets/scripts/dist/vendor.min.js',
        app: '/assets/scripts/dist/application.min.js'
    };
} else {
    App.use( require( 'connect-livereload' )({ port: 35729 }));

    // Development includes
    var assets = {
        stylesheet: '/assets/styles/application.css',
        vendors: '/assets/scripts/dist/vendor.js',
        app: '/assets/scripts/dist/application.js'
    };
}

// Global app config params
App.use( '/assets', Express.static( Path.join( __dirname, 'assets' ) ));
App.set( 'views', __dirname + '/' + config.templates_dir );
App.engine( 'html', require('ejs').renderFile );


///////////////////////////////////////////////////////////////////////////////
// Routes /////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


// Home
App.get( '/', function( req, res ) {
    // Merge in any additional args you want to pass to the route here
    var args = {};

    res.render( 'index.html', _.extend( args, assets ));
});

// Other API routes
App.get( '/api/auth/gettokens', api.getTokens );

// FOUR OH FOUR
App.get( '*', function( req, res ) {
    res.send( "Nothin' there, chief.", 404 );
});

// Away we go /////////////////////////////////////////////////////////////////
var port = Args.port ? Args.port : config.port,
    server = App.listen( port, function() {
    logger.info( 'Server active', { port: port } );
});

///////////////////////////////////////////////////////////////////////////////
// Functions //////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Configure logging
function SetupLogger () {
    return new (Winston.Logger)({
        transports: [
            new (Winston.transports.Console)({
                colorize: true,
                timestamp: true
            }),
            new (Winston.transports.File)({
                filename: __dirname + config.log_directory + 'app.log',
                maxsize: 100 * 1024 * 1024,
                maxFiles: 5
            })
        ]
    });
}
