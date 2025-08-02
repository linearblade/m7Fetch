/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
import HTTP from '../core/HTTP.js';
import Spec from '../spec/OpenAPISpec.js';

class OpenAPILoader {
  constructor(net = null) {
    this.net = net ?? new HTTP();
  }

  async load(input) {
    if (typeof input === 'object' && input !== null) {
      return new Spec(input, this.net);
    }

    if (typeof input === 'string') {
      const spec = await this.net.get(input, { json: true });
      return new Spec(spec, this.net);
    }

    throw new Error('OpenAPI.load() requires a URL or spec object.');
  }
}

export default OpenAPILoader;
