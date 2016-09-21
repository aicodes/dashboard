Forked from Electron boilerplate. Major features:

* The app will start a local HTTP server, listening to localhost:26337 in the main thread.
* When there is a request, it checks local cache. If no entries found, forward the request to api.ai.codes
* To help debugging etc, the render process (user's main window) would also display users Intention, Context and the Extension (our suggestions) on the dashboard.

A few technical notes.

# You can and should use es6 (latest Javascript standard) for the code base.
# There is no need to use babel or other transcompiler because Electron, built on Chromium + Nodejs, supports ES6.
# We impose "use strict"; on code so errors on undeclared variables can be caught (mostly because of typo).
# To run the dashboard for debugging, use
	npm run start
The app listens on localhost:26337 

Things that works:

* Snippet search: http://localhost:26337/snippet/string+to+int	(Synchronized API)
* Global Java class usage: http://localhost:26337/usage/1/java.lang.String  (Async API. may need to refresh the page if requested from Chrome)
* Global Java method/context similarity: http://localhost:26337/similarity/2/java.util.Map/remove (Async API may need to refresh if requested from Chrome)

