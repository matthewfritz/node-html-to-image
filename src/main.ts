import { Cluster } from "puppeteer-cluster";

import { Screenshot } from "./models/Screenshot";
import { makeScreenshot } from "./screenshot";
import { Options, ScreenshotParams } from "./types";

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
    maxConcurrency = 2,
    clusterOptions = {},
    terminateProcessOnError = true, // parity with the original process.exit(1) call on error
  } = options;

  /**
   * Provides an object that gives us parity with the original default cluster arguments but allows us the
   * flexibility to update some of the concurrency values directly.
   */
  const defaultClusterOptions = {
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency,
    timeout,
    puppeteerOptions: { ...puppeteerArgs, headless: "shell" },
    puppeteer: puppeteer,
  };

  // TODO: break the cluster out of the nodeHtmlToImage() logic so we can leverage an already-running cluster when
  // attempting to render the screenshots and take full advantage of the concurrency aspect
  const cluster: Cluster<ScreenshotParams> = await Cluster.launch({
    ...defaultClusterOptions,
    ...clusterOptions,
  });

  const shouldBatch = Array.isArray(content);
  const contents = shouldBatch ? content : [{ ...content, output, selector }];

  try {
    const screenshots: Array<Screenshot> = await Promise.all(
      contents.map((content) => {
        const { output, selector: contentSelector, ...pageContent } = content;
        return cluster.execute(
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
    await cluster.idle();

    // TODO: break this out along with the launching of the cluster so we're not closing and invalidating our
    // available browser instances after the single Puppeteer request finishes
    await cluster.close();

    return shouldBatch
      ? screenshots.map(({ buffer }) => buffer)
      : screenshots[0].buffer;
  } catch (err) {
    console.error(err);

    // TODO: same as the statement with the other "await cluster.close()" line; break this out into calling logic
    await cluster.close();

    // terminate the running process if we have been asked to do so; otherwise, give the calling logic the opportunity
    // to capture and handle the error with a bubble-up throw
    if (terminateProcessOnError) {
      process.exit(1);
    }
    throw err;
  }
}
