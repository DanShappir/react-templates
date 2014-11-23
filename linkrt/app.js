/**
 * Created by Dan_Shappir on 11/19/14.
 */
var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname)).listen(3000);
