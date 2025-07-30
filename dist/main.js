"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeHtmlToImage = void 0;
const puppeteer_cluster_1 = require("puppeteer-cluster");
const Screenshot_1 = require("./models/Screenshot");
const screenshot_1 = require("./screenshot");
function nodeHtmlToImage(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { html, encoding, transparent, content, output, selector, type, quality, puppeteerArgs = {}, timeout = 30000, puppeteer = undefined, cluster = undefined, // parity with no puppeteer-cluster instance supplied from caller by default
        clusterOptions = {}, // parity with no additional options added for puppeteer-cluster by default
        triggerClusterIdleAfterScreenshots = true, // parity with the original cluster.idle() call post-screenshots
        triggerClusterCloseAfterScreenshots = true, // parity with the original cluster.close() call post-screenshots
        triggerClusterCloseOnError = true, // parity with the original cluster.close() call after an error
        triggerProcessExitOnError = true, // parity with the original process.exit(1) call on error
        errorLogLinePrefix = undefined, // parity with no prefix on original logged error line
        errorLogLineAdditionalData = undefined, // parity with no additional data being logged on error
         } = options;
        /**
         * Provides a default for "headless" operation based upon whether the "headless" property is included in the
         * puppeteerArgs value so we can change the headed/headless run mode. If not, it falls-back to "shell" to maintain
         * parity with the original package logic.
         */
        const headless = "headless" in puppeteerArgs ? puppeteerArgs.headless : "shell";
        /**
         * Provides an object that gives us parity with the original default Puppeteer arguments but allows us the
         * flexibility to update some of the startup values directly.
         */
        const defaultPuppeteerOptions = Object.assign(Object.assign({}, puppeteerArgs), { headless });
        /**
         * Provides an object that gives us parity with the original default cluster arguments but allows us the
         * flexibility to update some of the concurrency values directly.
         */
        const defaultClusterOptions = {
            concurrency: puppeteer_cluster_1.Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: 2,
            timeout,
            puppeteerOptions: defaultPuppeteerOptions,
            puppeteer: puppeteer,
        };
        const shouldBatch = Array.isArray(content);
        const contents = shouldBatch ? content : [Object.assign(Object.assign({}, content), { output, selector })];
        // leverage an already-running cluster (if it has been supplied) while attempting to render the screenshots and take
        // full advantage of the concurrency aspect; otherwise, launch a default one with the supplied options as before
        const screenshotCluster = cluster !== null && cluster !== void 0 ? cluster : yield puppeteer_cluster_1.Cluster.launch(Object.assign(Object.assign({}, defaultClusterOptions), clusterOptions));
        try {
            const screenshots = yield Promise.all(contents.map((content) => {
                const { output, selector: contentSelector } = content, pageContent = __rest(content, ["output", "selector"]);
                return screenshotCluster.execute({
                    html,
                    encoding,
                    transparent,
                    output,
                    content: pageContent,
                    selector: contentSelector ? contentSelector : selector,
                    type,
                    quality,
                }, ({ page, data }) => __awaiter(this, void 0, void 0, function* () {
                    const screenshot = yield (0, screenshot_1.makeScreenshot)(page, Object.assign(Object.assign({}, options), { screenshot: new Screenshot_1.Screenshot(data) }));
                    return screenshot;
                }));
            }));
            // tell the cluster to idle and/or close itself after the screenshot process as necessary
            if (triggerClusterIdleAfterScreenshots) {
                yield screenshotCluster.idle();
            }
            if (triggerClusterCloseAfterScreenshots) {
                yield screenshotCluster.close();
            }
            return shouldBatch
                ? screenshots.map(({ buffer }) => buffer)
                : screenshots[0].buffer;
        }
        catch (err) {
            // allow prefix for easier identification of errors that resulted from the screenshot process and also allow any
            // additional data to be supplied in the error log as necessary
            const errorLogParts = [err];
            if (errorLogLinePrefix !== undefined) {
                errorLogParts.unshift(errorLogLinePrefix);
            }
            if (errorLogLineAdditionalData !== undefined) {
                errorLogParts.push(errorLogLineAdditionalData);
            }
            console.error(...errorLogParts);
            // tell the cluster to close itself on error as necessary
            if (triggerClusterCloseOnError) {
                yield screenshotCluster.close();
            }
            // terminate the running process if we have been asked to do so; otherwise, give the calling logic the opportunity
            // to capture and handle the error with a bubble-up throw
            if (triggerProcessExitOnError) {
                process.exit(1);
            }
            throw err;
        }
    });
}
exports.nodeHtmlToImage = nodeHtmlToImage;
