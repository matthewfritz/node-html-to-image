import type { Page, PuppeteerLifeCycleEvent, PuppeteerNodeLaunchOptions } from "puppeteer";
import { Cluster } from "puppeteer-cluster";
import type { Screenshot } from "./models/Screenshot";
export type Content = Array<{
    output: string;
    selector?: string;
}> | object;
export type Encoding = "base64" | "binary";
export type ImageType = "png" | "jpeg";
export interface ScreenshotParams {
    html: string;
    encoding?: Encoding;
    transparent?: boolean;
    type?: ImageType;
    quality?: number;
    selector?: string;
    content?: Content;
    output?: string;
}
export interface Options extends ScreenshotParams {
    puppeteerArgs?: PuppeteerNodeLaunchOptions;
    puppeteer?: any;
    waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    beforeScreenshot?: (page: Page) => void;
    timeout?: number;
    cluster?: Cluster;
    clusterOptions?: object;
    triggerClusterIdleAfterScreenshots?: boolean;
    triggerClusterCloseAfterScreenshots?: boolean;
    triggerClusterCloseOnError?: boolean;
    triggerProcessExitOnError?: boolean;
    errorLogLinePrefix?: string;
    errorLogLineAdditionalData?: any;
}
export interface MakeScreenshotParams {
    screenshot: Screenshot;
    waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    beforeScreenshot?: (page: Page) => void;
    handlebarsHelpers?: {
        [helpers: string]: (...args: any[]) => any;
    };
    timeout?: number;
}
