import type { PuppeteerNodeLaunchOptions } from "puppeteer";
import { Cluster } from "puppeteer-cluster";

import { Screenshot } from "./models/Screenshot";
import { makeScreenshot } from "./screenshot";
import { Options } from "./types";

export async function nodeHtmlToImage(options: Options) {
  const {
    html,
    encoding,
    transparent,
    content,
    output,
    selector,
    type,
    quality,
    puppeteerArgs = {},
    timeout = 30000,
    puppeteer = undefined,
    cluster = undefined, // parity with no puppeteer-cluster instance supplied from caller by default
    clusterOptions = {}, // parity with no additional options added for puppeteer-cluster by default
    triggerClusterIdleAfterScreenshots = true, // parity with the original cluster.idle() call post-screenshots
    triggerClusterCloseAfterScreenshots = true, // parity with the original cluster.close() call post-screenshots
    triggerClusterCloseOnError = true, // parity with the original cluster.close() call after an error
    terminateProcessOnError = true, // parity with the original process.exit(1) call on error
    errorLogLinePrefix = undefined, // parity with no prefix on original logged error line
    additionalDataToLogWithError = undefined, // parity with no additional data being logged on error
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
  const defaultPuppeteerOptions: PuppeteerNodeLaunchOptions = {
    ...puppeteerArgs,
    headless,
  };

  /**
   * Provides an object that gives us parity with the original default cluster arguments but allows us the
   * flexibility to update some of the concurrency values directly.
   */
  const defaultClusterOptions = {
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    timeout,
    puppeteerOptions: defaultPuppeteerOptions,
    puppeteer: puppeteer,
  };

  const shouldBatch = Array.isArray(content);
  const contents = shouldBatch ? content : [{ ...content, output, selector }];

  // leverage an already-running cluster (if it has been supplied) while attempting to render the screenshots and take
  // full advantage of the concurrency aspect; otherwise, launch a default one with the supplied options as before
  const screenshotCluster: Cluster = cluster ?? await Cluster.launch({
    ...defaultClusterOptions,
    ...clusterOptions,
  });

  try {
    const screenshots: Array<Screenshot> = await Promise.all(
      contents.map((content) => {
        const { output, selector: contentSelector, ...pageContent } = content;
        return screenshotCluster.execute(
          {
            html,
            encoding,
            transparent,
            output,
            content: pageContent,
            selector: contentSelector ? contentSelector : selector,
            type,
            quality,
          },
          async ({ page, data }) => {
            const screenshot = await makeScreenshot(page, {
              ...options,
              screenshot: new Screenshot(data),
            });
            return screenshot;
          },
        );
      }),
    );

    // tell the cluster to idle and/or close itself after the screenshot process as necessary
    if (triggerClusterIdleAfterScreenshots) {
      await screenshotCluster.idle();
    }
    if (triggerClusterCloseAfterScreenshots) {
      await screenshotCluster.close();
    }

    return shouldBatch
      ? screenshots.map(({ buffer }) => buffer)
      : screenshots[0].buffer;
  } catch (err) {
    // allow prefix for easier identification of errors that resulted from the screenshot process and also allow any
    // additional data to be supplied in the error log as necessary
    const errorLogParts = [ err ];
    if (errorLogLinePrefix !== undefined) {
      errorLogParts.unshift(errorLogLinePrefix);
    }
    if (additionalDataToLogWithError !== undefined) {
      errorLogParts.push(additionalDataToLogWithError);
    }
    console.error(...errorLogParts);

    // tell the cluster to close itself on error as necessary
    if (triggerClusterCloseOnError) {
      await screenshotCluster.close();
    }

    // terminate the running process if we have been asked to do so; otherwise, give the calling logic the opportunity
    // to capture and handle the error with a bubble-up throw
    if (terminateProcessOnError) {
      process.exit(1);
    }
    throw err;
  }
}
