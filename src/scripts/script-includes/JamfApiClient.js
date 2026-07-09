/**
 * Script Include class file: Glide APIs (gs, GlideRecord, sn_ws, ...) are
 * auto-available in this execution context — do NOT import them here. Use ES5
 * only (Class.create, no ES6 classes, no arrow functions, `var` only). `type`
 * must match the class name and the `name` in the fluent definition exactly.
 *
 * JamfApiClient — OAuth (client credentials) + generic paginated HTTP against
 * the Jamf Pro API. Owns all sn_ws.RESTMessageV2 usage. No REST Message
 * records, no connection aliases. Takes a JamfConfig instance for endpoint and
 * credential access.
 *
 *   var client = new x_912401_jamf_pro.JamfApiClient(new x_912401_jamf_pro.JamfConfig());
 *   var data = client.get('/api/v1/computers-inventory', { 'page-size': 100 });
 */
var JamfApiClient = Class.create();

JamfApiClient.prototype = {
    /**
     * @param {Object} config - a JamfConfig instance (or compatible object
     *   exposing getBaseUrl/getClientId/getClientSecret/getPageSize/debug).
     */
    initialize: function (config) {
        this._config = config;
        this._token = null;
        this._tokenExpiresAt = 0;
    },

    /**
     * Requests a fresh OAuth bearer token via the client-credentials grant and
     * caches it. Throws on any non-200 response.
     * @return {string} the access token
     */
    _fetchToken: function () {
        var url = this._config.getBaseUrl() + '/api/oauth/token';
        var body = 'grant_type=client_credentials' +
            '&client_id=' + encodeURIComponent(this._config.getClientId()) +
            '&client_secret=' + encodeURIComponent(this._config.getClientSecret());

        var request = new sn_ws.RESTMessageV2();
        request.setHttpMethod('POST');
        request.setEndpoint(url);
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.setRequestBody(body);

        var response = request.execute();
        var status = parseInt(response.getStatusCode(), 10);
        var respBody = response.getBody();

        if (status !== 200) {
            throw new Error('Jamf token request failed: HTTP ' + status + ' ' + this._truncate(respBody, 500));
        }

        var parsed = this._parseJson(respBody);
        var expiresIn = parseInt(parsed.expires_in, 10);
        if (isNaN(expiresIn)) {
            expiresIn = 0;
        }

        this._token = parsed.access_token;
        // Expire 60s early to avoid using a token that dies mid-flight.
        this._tokenExpiresAt = new Date().getTime() + ((expiresIn - 60) * 1000);

        this._config.debug('JamfApiClient: acquired OAuth token (expires_in=' + expiresIn + 's)');
        return this._token;
    },

    /**
     * Returns a valid cached token, fetching a new one when absent or expired.
     * @return {string} the access token
     */
    _getToken: function () {
        var now = new Date().getTime();
        if (this._token && now < this._tokenExpiresAt) {
            return this._token;
        }
        return this._fetchToken();
    },

    /**
     * Clears the cached token so the next request re-authenticates.
     */
    invalidateToken: function () {
        this._token = null;
        this._tokenExpiresAt = 0;
    },

    /**
     * Performs an authenticated GET and returns the parsed JSON body.
     * Retries exactly once on a 401 (invalidate + re-fetch token). Throws on
     * any other non-2xx; the thrown Error carries an `httpStatus` marker so
     * callers can branch (e.g. 404 fallback probes).
     * @param {string} path - path beginning with '/', appended to base URL
     * @param {Object} [params] - query params; array values repeat the key
     * @return {Object} parsed JSON response
     */
    get: function (path, params) {
        var attempt = 0;
        while (true) {
            var token = this._getToken();
            var url = this._config.getBaseUrl() + path;
            var qs = this._buildQuery(params);
            if (qs) {
                url += (path.indexOf('?') >= 0 ? '&' : '?') + qs;
            }

            var request = new sn_ws.RESTMessageV2();
            request.setHttpMethod('GET');
            request.setEndpoint(url);
            request.setRequestHeader('Authorization', 'Bearer ' + token);
            request.setRequestHeader('Accept', 'application/json');

            var response = request.execute();
            var status = parseInt(response.getStatusCode(), 10);
            var body = response.getBody();

            // Token may have been revoked/expired server-side; retry once.
            if (status === 401 && attempt === 0) {
                this._config.debug('JamfApiClient: 401 on GET ' + path + '; re-authenticating and retrying once');
                this.invalidateToken();
                attempt++;
                continue;
            }

            if (status >= 200 && status < 300) {
                return this._parseJson(body);
            }

            var err = new Error('Jamf API request failed: GET ' + path + ' HTTP ' + status + ' ' + this._truncate(body, 500));
            err.httpStatus = status;
            throw err;
        }
    },

    /**
     * Performs an authenticated POST with an optional JSON body. Retries exactly
     * once on a 401 (invalidate + re-fetch token). Unlike get(), does NOT throw
     * on 4xx/5xx — it returns { httpStatus, body } so the command Service can map
     * a non-2xx to an `error` row and record the status. Throws only on network
     * failure. Some action endpoints return 202 with an empty/non-JSON body.
     * @param {string} path - path beginning with '/', appended to base URL
     * @param {Object} [body] - serialized as JSON; omit/null for no body
     * @param {Object} [headers] - extra request headers
     * @return {Object} { httpStatus: number, body: Object }
     */
    post: function (path, body, headers) {
        var attempt = 0;
        while (true) {
            var token = this._getToken();
            var url = this._config.getBaseUrl() + path;

            var request = new sn_ws.RESTMessageV2();
            request.setHttpMethod('POST');
            request.setEndpoint(url);
            request.setRequestHeader('Authorization', 'Bearer ' + token);
            request.setRequestHeader('Accept', 'application/json');
            if (body !== null && typeof body !== 'undefined') {
                request.setRequestHeader('Content-Type', 'application/json');
                request.setRequestBody(JSON.stringify(body));
            }
            if (headers) {
                for (var h in headers) {
                    if (headers.hasOwnProperty(h)) {
                        request.setRequestHeader(h, headers[h]);
                    }
                }
            }

            var response = request.execute();
            var status = parseInt(response.getStatusCode(), 10);
            var respBody = response.getBody();

            if (status === 401 && attempt === 0) {
                this._config.debug('JamfApiClient: 401 on POST ' + path + '; re-authenticating and retrying once');
                this.invalidateToken();
                attempt++;
                continue;
            }

            var parsed = {};
            if (respBody) {
                try {
                    parsed = JSON.parse(respBody);
                } catch (e) {
                    // 202/empty or non-JSON body: keep a truncated copy for the log.
                    parsed = { raw: this._truncate(respBody, 500) };
                }
            }
            return { httpStatus: status, body: parsed };
        }
    },

    /**
     * Jamf-style pagination driver. Fetches pages starting at `page` 0 using
     * `page-size` from config plus whatever params (e.g. `sort`, `section`) the
     * caller supplies. Invokes `onPage(results)` per non-empty page and never
     * accumulates results itself (memory-bounded). Stops when: a page is empty,
     * the accumulated count reaches the first page's `totalCount`, a short page
     * is returned, or a 1000-page hard cap is hit (drift guard).
     * @param {string} path
     * @param {Object} [params]
     * @param {Function} onPage - callback receiving the array of page results
     * @return {number} total number of results fetched
     */
    getAllPages: function (path, params, onPage) {
        var pageSize = this._config.getPageSize();
        var base = params || {};
        var page = 0;
        var totalFetched = 0;
        var totalCount = -1;
        var maxPages = 1000;

        while (page < maxPages) {
            var q = {};
            for (var k in base) {
                if (base.hasOwnProperty(k)) {
                    q[k] = base[k];
                }
            }
            q.page = page;
            q['page-size'] = pageSize;

            var data = this.get(path, q);
            var results = (data && data.results) ? data.results : [];

            // Capture the run size once, from the first page.
            if (page === 0 && data && typeof data.totalCount !== 'undefined' && data.totalCount !== null) {
                totalCount = parseInt(data.totalCount, 10);
                if (isNaN(totalCount)) {
                    totalCount = -1;
                }
            }

            if (!results.length) {
                break;
            }

            onPage(results);
            totalFetched += results.length;

            if (totalCount >= 0 && totalFetched >= totalCount) {
                break;
            }
            if (results.length < pageSize) {
                break;
            }

            page++;
        }

        return totalFetched;
    },

    /**
     * Builds an encoded query string from a params object. Array values emit a
     * repeated key (e.g. section=GENERAL&section=HARDWARE). null/undefined
     * values are skipped.
     * @param {Object} params
     * @return {string} query string without a leading '?'
     */
    _buildQuery: function (params) {
        if (!params) {
            return '';
        }
        var parts = [];
        for (var key in params) {
            if (!params.hasOwnProperty(key)) {
                continue;
            }
            var value = params[key];
            if (value === null || typeof value === 'undefined') {
                continue;
            }
            if (value instanceof Array) {
                for (var i = 0; i < value.length; i++) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value[i]));
                }
            } else {
                parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            }
        }
        return parts.join('&');
    },

    /**
     * Parses a JSON response body, throwing a descriptive Error on bad JSON.
     * @param {string} body
     * @return {Object}
     */
    _parseJson: function (body) {
        if (!body) {
            return {};
        }
        try {
            return JSON.parse(body);
        } catch (e) {
            throw new Error('Jamf API returned unparseable JSON: ' + this._truncate(body, 500));
        }
    },

    /**
     * Returns the first `max` characters of a value, coerced to string.
     * @param {*} str
     * @param {number} max
     * @return {string}
     */
    _truncate: function (str, max) {
        if (str === null || typeof str === 'undefined') {
            return '';
        }
        var s = String(str);
        if (s.length <= max) {
            return s;
        }
        return s.substring(0, max);
    },

    type: 'JamfApiClient'
};
