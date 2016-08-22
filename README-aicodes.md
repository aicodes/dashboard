Forked from Electron boilerplate. Major features:

* The app will start a local HTTP server, listening to localhost:26337 in the main thread.
* When there is a request, it checks local cache. If no entries found, forward the request to api.ai.codes
* To help debugging etc, the render process (user's main window) would also display users Intention, Context and the Extension (our suggestions) on the dashboard.
