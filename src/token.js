/** IPC: main process. */

import { config } from './simple_config';

const request = require('request');

const AUTH0_CLIENT_ID = 'oxMGzY0M3IjmvNJ0tplq3vKgwa6965Nh';
const AUTH0_DOMAIN = 'aicodes.auth0.com';

/**
 * Fetch refresh token from oauth server.
 */
function fetchNewAccessToken(refresh_token) {
  const option = {
    method: 'post',
    url: `https://${AUTH0_DOMAIN}/delegation`,
    json: true,
    headers: {
      'User-Agent': 'Dashboard',
    },
    json: {
      client_id: AUTH0_CLIENT_ID,
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      refresh_token,
      api_type: 'app',
    },
  };
  request(option, (error, response, body) => {
    if (body.hasOwnProperty('id_token')) {
      console.log(body.id_token);
      config.set('token', body.id_token);
    } else {
      console.log(body);
    }
  });
}

export {
  fetchNewAccessToken,
};
