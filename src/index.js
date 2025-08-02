/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
// Public entry point for network module

import Net from './core/Net.js';
import HTTP from './core/HTTP.js';

export { Net, HTTP };
export * from './core/fetch_enum.js';

export default Net;
