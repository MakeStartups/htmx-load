// htmx-load.js, MIT Copyright 2024 Make Startups, Inc and Eric Harrison 
//
// See README.md for usage examples and recipes.

// HtmxLoad is a top-level object to make it easier to track and manage 
// lazy-loaded and view-specific scripts inside an htmx-powered web 
// application. 
//
// As an example, if an htmx partial contains a script tag in  
// the return, this code will be re-executed when a page is loaded a second 
// time and will throw errors like `Error: const varname cannot be redefined.`.
//
// To fix this type of error, the HtmxLoad library provides one solution 
// for maanaging JS resources and library usage inside an htmx-style app.
const HtmxLoad = {
	'DEBUG': false, // debug mode, when on, logs to console.

	// scripts is a storage object to track view-specific JS files have
	// been executed. We can use this object to see if a specific JS file has 
	// already been added to the global context and potentially skip it 
	// on future page loads.
	'scripts': {},

	// The current window.location.pathname will be stored here and will 
	// serve as a key for determining which code to execute.
	'current_route': null,

	// storage location for view specific load callbacks.
	'route_handlers': {},

	// The 'data' object will provide view-specific storage and will persist 
	// across page loads over multiple pages. 
	//
	// https://server.com/view_name/whatever = HtmxLoad['view_name'] = {};
	'data': {},

	// TEMPORARY view specific storage. Completely wiped out any time 
	// `current_route` is changed.
	'temp': {},

	// function and callback storage. 
	'__registered': {},
};

/** This function allows you to define a function that will be called every time 
 * a view is loaded via the route parameter. 
 *
 * WARNING: YOU are responsible for making sure that your callback function can
 * survive being called multiple times in a single session. 
 *
 * @param {string} route The route argument specifies what pages will run 
 *	  this handler on load.
 * @param {jsViewHandler} callback A function that will be called when a page 
 *	  is loaded for the first time. You are responsible for making sure that your
 *	  callback function can handle being called multiple times in a single session.
 *
 * @returns {number} handlers_defined A count of all the registered handlers for 
 *	  this route.
 */
HtmxLoad.register = function(route, callback) {
	// strip slashes on the route before using it as a key
	route = route.replace(/^\//, '').replace(/\/$/, '');

	if ( ! (route in HtmxLoad.route_handlers) ) {
		HtmxLoad.route_handlers[route] = [];
		HtmxLoad.__registered[route] = [];
	}

	// Convert the entire callback to a string and store it in this route. 
	// Prevent duplicate functions from being registered.
	const cb_string = callback.toString();
	if ( ! HtmxLoad.__registered[route].includes(cb_string) ) {
		HtmxLoad.DEBUG && console.log(`${route} callback added for the first time.`);
		HtmxLoad.route_handlers[route].push(callback);
		HtmxLoad.__registered[route].push(cb_string);
	} else {
		HtmxLoad.DEBUG && console.warn(`${route} callback has already been registered.`);
	}

	return HtmxLoad.route_handlers[route].length;
};

/** This function takes a route as it's only parameter and then runs:
 *	  1. Any "global" route handler that has been defined for all pages.
 *	  2. All route handler functions specific to this route.
 *
 * @param {string} route A URL path (after hostname). Ex: `/blog/34/Cool-Title`
 *	  1. Run all route handlers defined for `blog`
 *	  2. Run all route handlers defined for `blog/3`
 *	  3. Run all route handlers defined for `blog/3/Cool-Title`
 *
 *	@param {Event} ev The event object from whichever eventListener 
 *	function that called HtmxLoad.run
 */
HtmxLoad.run = function(route, ev) {
	HtmxLoad.DEBUG && console.log(`RUNNING route handlers for ("${route}")`);

	if ( ! route ) {
		route = '';
	}

	if ( route !== HtmxLoad.current_route ) {
		HtmxLoad.current_route = route;

		// If your application has pages with a lot of vertical scrolling, 
		// you may want to uncomment the timeout function below to smoothely 
		// scroll to the top of the page whenever your user is attempting to 
		// go to a new URL.
		/*	
		setTimeout(function() {
			window.scrollTo({ top: 0, behavior: 'instant'});
		}, 50);
		*/
	} else {
		// In our application, we choose to rerun callback functions 
		// if the user clicks a link that would reload the page.
		//
		// You may want to have a different mechanism, so returning from this 
		// function here may be more appropriate for your use-case. 
		HtmxLoad.DEBUG && console.log('Duplicate route execution "${route}"');
		// return true;
	}

	// Clear out any temp data.
	delete HtmxLoad.temp;
	HtmxLoad.temp = {};

	route = route.replace(/^\//, ''); // remove leading slash 

	// get the first URL path part and use that to generate view-specific 
	// storage.
	const view_name = route.split('/')[0];
	if ( ! (view_name in HtmxLoad.data) ) {
		HtmxLoad.data[view_name] = {};
	}

	// always run our initial empty path in case there are application 
	// "global" handlers defined. Any callback added without a URL path 
	// will be treated as a global initialization handler and run on every 
	// single page load.
	const path_parts = route.split('/');
	let path = '';
	HtmxLoad.__run_if_exists(path, ev);

	while ( paths.length ) {
		path += paths.shift(); 
		HtmxLoad.__run_if_exists(path, ev);
		path += '/';
	}
};

/** This function executes every function in an array stored by route_part.
 *
 * @param {string} route A URL path (after hostname). Ex: `/blog/34/Cool-Title`
 *
 *	@param {Event} ev The event object from whichever eventListener 
 *	function that called HtmxLoad.run
 */
HtmxLoad.__run_if_exists = function(route_part, ev) {
	if ( path in HtmxLoad.route_handlers ) {
		const handlers = HtmxLoad.route_handlers[path];
		HtmxLoad.DEBUG && console.log('	  ', `running => "${path}"`, handlers.length);
		for ( let i = 0; i < handlers.length; ++i ) {
			HtmxLoad.DEBUG && console.log('		', `${i} => `, handlers[i]);

			// run the stored callback function 
			handlers[i](ev);
		}
	}
};

// Official Event handler callback function for every event we're watching. 
//
function htmx_load_event_handler(ev) {
	HtmxLoad.run(window.location.pathname, ev);
}

// Officially register callback function for all possible page load/ready 
// events in the browser.
document.addEventListener('DOMContentLoaded', htmx_load_event_handler);
document.addEventListener('htmx:afterSettle', htmx_load_event_handler);

// popstate is the Window event that fires if you use your back button 
// to navigate to a previous page. With htmx, you haven't left the actual 
// page, but navigating backwards will attempt to load that view. You need 
// to be able to re-run your registered callback functions.
//
// See: https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event 
window.addEventListener('popstate', htmx_load_event_handler);

// htmx-load.js, MIT Copyright 2024 Make Startups, Inc and Eric Harrison 
