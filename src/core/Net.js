/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
import HTTP          from './HTTP.js';
import AutoLoader    from '../loader/AutoLoader.js';
import SpecManager   from '../spec/SpecManager.js';
import ModuleManager from '../modules/ModuleManager.js';
import BatchLoader   from '../batch/BatchLoader.js';

/**
 * Net
 * ---
 * Central interface for network operations including:
 * - HTTP requests
 * - dynamic spec (e.g. OpenAPI) loading
 * - modular API call management
 * - dynamic JS module importing
 * - batched request orchestration
 *
 * Intended as a one-stop hub for apps interacting with dynamic, declarative, or
 * service-driven APIs. Each subcomponent is accessible through its respective namespace.
 *
 * Usage:
 * ```js
 * const net = new Net();
 * await net.specs.load('/specs/openapi.json');
 * const res = await net.specs.call('mySpec', 'listItems');
 * ```
 */
export class Net {
    constructor(opts = {}) {
        /**
         * Generic HTTP request layer.
         * See HTTP.js for supported options.
         */
        this.http = new HTTP(opts);

        /**
         * Loads a spec document from a URL or object (e.g., OpenAPI).
         */
        this.loader = new AutoLoader(this.http);

        /**
         * Manages multiple spec documents and provides unified call access.
         */
        this.specs = new SpecManager({ http: this.http, loader: this.loader });

        /**
         * Dynamically loads and manages JavaScript modules by ID.
         */
        this.modules = new ModuleManager(this);

        /**
         * Coordinates multiple HTTP requests and triggers a callback when all complete.
         */
        this.batch = new BatchLoader(this);
    }
}

export default Net;
