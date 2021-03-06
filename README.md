AI.codes dashboard
==================

AI.codes dashboard is an Electron app. It provides insightful information as developers code.

### Quick start

The only development dependency of this project is [Node.js](https://nodejs.org). So just make sure you have it installed.
Then type few commands known to every Node developer...
```
git clone https://github.com/aicodes/dashboard
cd dashboard
npm install
npm start
```
... and boom! You have running desktop application on your screen.

### Core Pieces

* The app will start a local HTTP/WebSocket server, listening to `localhost:26337` in the main thread.
* For good user experience, most of HTTP requests from editor return immediately. If no answers can be found by checking local cache, the request is forwarded to https://api.ai.codes.
* The WebSocket endpoint receives stream of events from editors to help AI make decisions, but none of your code will be uploaded to server.

### Technical notes

* You can and should use ES6 (latest Javascript standard) code style. The app is configured to understand ES6 under `src`. The lint tool helps preventing a lot of bugs. To run lint, use `eslint --fix src`.
* To run the dashboard, use `npm run start`. The app listens on localhost:26337.
* The local server is implemented using express.js framework. Most of the code is in `editor_api.js`. The part that interacts with server is in `local_server.js`.

### Editor APIs

Will have better documentation soon, but for now.

* Snippet search: http://localhost:26337/snippet/string+to+int	(Synchronized API)
* Global Java class usage: http://localhost:26337/usage/1/java.lang.String  (Async API. may need to refresh the page if requested from Chrome)
* Global Java method/context similarity: http://localhost:26337/similarity/2/java.util.Map/remove (Async API may need to refresh if requested from Chrome)
