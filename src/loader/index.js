/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
// Public loader registry for spec formats

import OpenAPILoader from './OpenAPILoader.js';
// import SimpleLoader from './Simple.js'; // Placeholder for future

export const loaders = {
  openapi: OpenAPILoader,
  // simple: SimpleLoader
};

export default loaders;
