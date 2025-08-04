import HTTP from './HTTP.js';

// Extend the HTTP class to provide custom defaults
class MyHTTP extends HTTP {
    static FETCH_DEFAULTS = {
        mode: 'cors',
        credentials: 'include',
        cache: 'no-cache'
    };
}

const http = new MyHTTP();

// This will override mode and add a timeout, but ignore invalid entries
const fetchOpts = http.buildDefaultFetchOpts({
    mode: 'same-origin',   // Valid override
    timeout: 5000,         // Not part of FETCH_CONSTANTS — will be ignored
    credentials: 'omit'    // Valid override
});

console.log(fetchOpts);
// Output (if all values are valid):
// {
//   mode: 'same-origin',
//   credentials: 'omit',
//   cache: 'no-cache'
// }