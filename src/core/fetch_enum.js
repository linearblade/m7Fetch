/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
export const constants = {
    mode: [
	'cors',
	'no-cors',
	'same-origin'
    ],

    cache: [
	'default',
	'no-store',
	'reload',
	'no-cache',
	'force-cache',
	'only-if-cached'
    ],

    referrer: [
	//'no-referrer',
	//'client',
	// or a string URL, 
    ],

    priority: [
	'auto',
	'high',
	'low'
    ],

    keepalive: [
	true,
	false
    ],

    integrity: [
	 //  valid values are arbitrary SRI strings, so anything can pass
    ],

    referrerPolicy: [
	'no-referrer',
	'no-referrer-when-downgrade',
	'origin',
	'origin-when-cross-origin',
	'same-origin',
	'strict-origin',
	'strict-origin-when-cross-origin',
	'unsafe-url'
    ],

    credentials: [
	'omit',
	'same-origin',
	'include'
    ],

    redirect: [
	'follow',
	'error',
	'manual'
    ],

    duplex: ['half'],

    signal: [true,false],
    //method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH']
};
export default constants;
