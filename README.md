<h1 align="center">Welcome to node-html-to-image 🌄</h1>

**NOTE**: I forked this from [frinyvonnick/node-html-to-image](https://github.com/frinyvonnick/node-html-to-image) - _Release v5.0.0_ ([original tag commit](https://github.com/frinyvonnick/node-html-to-image/commit/d51edae00fe11df2fd1b27ac4c940de5aae0d516) | [original tag release](https://github.com/frinyvonnick/node-html-to-image/releases/tag/v5.0.0)) for the express purpose of refactoring the concurrency and Puppeteer clustering functionality.

My fork is intended to allow the calling logic / service to have greater control over the Puppeteer operations and not auto-terminate clusters and processes to promote reuse in distributed environments. It is also intended to have drop-in parity with the way the original package functions by default even if the concurrency updates are not being leveraged.

The [original usage license](LICENSE) has also remained unmodified to ensure there is no sudden change in criteria when using this fork versus the original package.

Much of the documentation has also remained the same with some reorganization and additive changes also made to describe new functionality.

-- [@matthewfritz](https://github.com/matthewfritz)

<p>&nbsp;</p>
<p>
  <a href="https://github.com/matthewfritz/node-html-to-image/releases" target="_blank">
    <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  </a>
  <a href="https://github.com/matthewfritz/node-html-to-image#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/matthewfritz/node-html-to-image/blob/master/LICENSE" target="_blank">
    <img alt="License: Apache--2.0" src="https://img.shields.io/badge/License-Apache--2.0-yellow.svg" />
  </a>
</p>

> A Node.js library that generates images from HTML

### 🏠 [Homepage](https://github.com/matthewfritz/node-html-to-image)

## Table of Contents

- [Description](#description)
- [Install](#install)
- [Usage](#usage)
  - [TypeScript Support](#typescript-support)
  - [Options](#options)
- [Examples](#examples)
  - [Simple example](#simple-example)
  - [Setting output image resolution](#setting-output-image-resolution)
  - [Example with Handlebars](#example-with-handlebars)
  - [Using Handlebars helpers](#using-handlebars-helpers)
  - [Dealing with images](#dealing-with-images)
  - [Using the buffer instead of saving to disk](#using-the-buffer-instead-of-saving-to-disk)
  - [Generating multiple images](#generating-multiple-images)
  - [Using different puppeteer libraries](#using-different-puppeteer-libraries)
- [Run tests](#run-tests)
- [Related](#related)
  - [Libraries](#libraries)
  - [Articles](#articles)
- [Author](#author)
- [Show your support](#show-your-support)
- [License](#-license)


## Description

This module exposes a function that generates images (png, jpeg) from HTML. It uses [puppeteer](https://github.com/puppeteer) in headless mode to achieve it. Additionally, it embarks [Handlebars](https://handlebarsjs.com/) to provide a way to add logic in your HTML.

## Install

```sh
npm install @matthewfritz/node-html-to-image
# or
yarn add @matthewfritz/node-html-to-image
```

Note: When you install Puppeteer, it downloads a recent version of Chromium (~170MB Mac, ~282MB Linux, ~280MB Win) that is guaranteed to work with the API. 

## Usage

### TypeScript support

The library is written in Typescript so it is available out of the box:

```ts
import nodeHtmlToImage from 'node-html-to-image'
```

### Options

List of all available **original** options:

| option            | description                                                                                                                                                                                                            | type                                            | required    |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|-------------|
| output            | The output path for generated image                                                                                                                                                                                    | string                                          | optional    |
| html              | The html used to generate image content                                                                                                                                                                                | string                                          | required    |
| type              | The type of the generated image                                                                                                                                                                                        | jpeg or png (default: png)                      | optional    |
| quality           | The quality of the generated image (only applicable to jpg)                                                                                                                                                            | number (default: 80)                            | optional    |
| content           | If provided html property is considered an handlebars template and use content value to fill it                                                                                                                        | object or Array                                 | optional    |
| waitUntil         | Define when to consider markup succeded. [Learn more](https://github.com/puppeteer/puppeteer/blob/8370ec88ae94fa59d9e9dc0c154e48527d48c9fe/docs/api.md#pagesetcontenthtml-options).                                    | string or Array<string> (default: networkidle0) | optional    |
| puppeteer         | The puppeteer property let you use a different puppeteer library (like puppeteer-core or puppeteer-extra).                                                                                                             | object (default: puppeteer)                     | optional    |
| puppeteerArgs     | The puppeteerArgs property let you pass down custom configuration to puppeteer. [Learn more](https://github.com/puppeteer/puppeteer/blob/8370ec88ae94fa59d9e9dc0c154e48527d48c9fe/docs/api.md#puppeteerlaunchoptions). | object                                          | optional    |
| beforeScreenshot  | An async function that will execute just before screenshot is taken. Gives access to puppeteer page element.                                                                                                           | Function                                        | optional |
| transparent       | The transparent property lets you generate images with transparent background (for png type).                                                                                                                          | boolean                                         | optional    |
| encoding          | The encoding property of the image. Options are `binary` (default) or `base64`.                                                                                                                                        | string                                          | optional    |
| selector          | The selector property lets you target a specific element to perform the screenshot on. (default `body`)                                                                                                                | string                                          | optional    |
| handlebarsHelpers | The handlebarsHelpers property lets add custom logic to the templates using Handlebars sub-expressions. [Learn more](https://handlebarsjs.com/guide/builtin-helpers.html#sub-expressions).                             | object                                          | optional |
| timeout           | Timeout for a [puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster#clusterlaunchoptions) (in `ms`). Defaults to `30000` (30 seconds).                                                                | number                                          | optional |


List of all available **added** options with set defaults to allow drop-in parity with original package:

| option                              | description                                                                                                                                                                                          | type                      | required    |
|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------|-------------|
| cluster                             | A running [puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster#usage) instance to use instead of spawning a new one by default during the `nodeHtmlToImage()` call                 | Cluster                   | optional    |
| clusterOptions                      | An object containing configuration options for the default [puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster#usage) instance spawned when not supplying the `cluster` argument  | object                    | optional    |
| triggerClusterIdleAfterScreenshots  | Whether to call the `idle()` method on the cluster after the screenshot process has finished successfully                                                                                            | boolean (default: `true`) | optional    |
| triggerClusterCloseAfterScreenshots | Whether to call the `close()` method on the cluster after the screenshot process has finished successfully                                                                                           | boolean (default: `true`) | optional    |
| triggerClusterCloseOnError          | Whether to call the `close()` method on the cluster after an error has occurred during the screenshot operation                                                                                      | boolean (default: `true`) | optional    |
| terminateProcessOnError             | Whether to call `process.exit(1)` to terminate the process after an error has occurred during the screenshot operation                                                                               | boolean (default: `true`) | optional    |
| errorLogLinePrefix                  | A string prefix to write within the console line logged when an error has occurred during the screenshot operation                                                                                   | string                    | optional    |
| errorLogLineAdditionalData          | Any additional data to write within the console line logged when an error has occurred during the screenshot operation                                                                               | any                       | optional    |


## Examples

### Simple example

```js
const nodeHtmlToImage = require('node-html-to-image')

nodeHtmlToImage({
  output: './image.png',
  html: '<html><body>Hello world!</body></html>'
})
  .then(() => console.log('The image was created successfully!'))
```

### Setting output image resolution

`node-html-to-image` takes a screenshot of the body tag's content. If you want to set output image's resolution you need to set its dimension using CSS like in the following example.

```js
const nodeHtmlToImage = require('node-html-to-image')

nodeHtmlToImage({
  output: './image.png',
  html: `<html>
    <head>
      <style>
        body {
          width: 2480px;
          height: 3508px;
        }
      </style>
    </head>
    <body>Hello world!</body>
  </html>
  `
})
  .then(() => console.log('The image was created successfully!'))
```

### Example with Handlebars

[Handlerbars](https://handlebarsjs.com/) is a templating language. It generates HTML from a template and an input object. In the following example we provide a template to `node-html-to-image` and a content object to fill the template.

```js
const nodeHtmlToImage = require('node-html-to-image')

nodeHtmlToImage({
  output: './image.png',
  html: '<html><body>Hello {{name}}!</body></html>',
  content: { name: 'you' }
})
  .then(() => console.log('The image was created successfully!'))
```

[Handlebars](https://handlebarsjs.com/) provides a lot of expressions to handle common use cases like conditions or loops.


### Using Handlebars helpers

[Handlerbars sub-expressions](https://handlebarsjs.com/guide/builtin-helpers.html#sub-expressions) can be used to add custom logic to the templates. To do this, you must pass a `handlebarsHelpers` object with functions defined within.

For example, if you had a variable and wanted to do some conditional rendering depending on its value, you could do this:

```js
const nodeHtmlToImage = require('node-html-to-image')

nodeHtmlToImage({
  output: './image.png',
  content: { myVar: 'foo' },
  handlebarsHelpers: {
    equals: (a, b) => a === b,
  },
  html: `
    <html>
      <body>
        {{#if (equals myVar 'foo')}}<div>Foo</div>{{/if}}
        {{#if (equals myVar 'bar')}}<div>Bar</div>{{/if}}
      </body>
    </html>`
  
})
```

### Dealing with images

If you want to display an image which is stored remotely do it as usual. In case your image is stored locally I recommend having your image in `base64`. Then you need to pass it to the template with the content property. Here is an example:

```js
const nodeHtmlToImage = require('node-html-to-image')
const fs = require('fs');

const image = fs.readFileSync('./image.jpg');
const base64Image = new Buffer.from(image).toString('base64');
const dataURI = 'data:image/jpeg;base64,' + base64Image

nodeHtmlToImage({
  output: './image.png',
  html: '<html><body><img src="{{{imageSource}}}" /></body></html>',
  content: { imageSource: dataURI }
})
```
### Dealing with fonts
If you want to apply fonts, you need to synchronize your parts loading of your website. One way doing it is to convert your font to base64 and add it to your style in your html. For example:
```js
const font2base64 = require('node-font2base64')

const _data = font2base64.encodeToDataUrlSync('../my/awesome/font.ttf')

const html = `
<html>
  <head>
    <style>
      @font-face {
        font-family: 'testFont';
        src: url("{{{_data}}}") format('woff2'); // don't forget the format!
      }
    </style>
  </head>
...
``` 

### Using the buffer instead of saving to disk

If you don't want to save the image to disk and would rather do something with it immediately, you can use the returned value instead! The example below shows how you can generate an image and send it back to a client via using [express](https://github.com/expressjs/express).

```js
const express = require('express');
const router = express.Router();
const nodeHtmlToImage = require('node-html-to-image');

router.get(`/api/tweet/render`, async function(req, res) {
  const image = await nodeHtmlToImage({
    html: '<html><body><div>Check out what I just did! #cool</div></body></html>'
  });
  res.writeHead(200, { 'Content-Type': 'image/png' });
  res.end(image, 'binary');
});
```

### Generating multiple images

If you want to generate multiple images in one call you must provide an array to the content property. 

#### Saving to disk

To save on the disk you must provide the output property on each object in the content property.

```js
nodeHtmlToImage({
  html: '<html><body>Hello {{name}}!</body></html>',
  content: [{ name: 'Pierre', output: './image1.png' }, { name: 'Paul', output: './image2.png' }, { name: 'Jacques', output: './image3.png' }]
})
  .then(() => console.log('The images were created successfully!'))
```

#### Using buffers

If you don't want to save the images to disk you can use the returned value instead. It returns an array of Buffer objects.

```js
const images = await nodeHtmlToImage({
  html: '<html><body>Hello {{name}}!</body></html>',
  content: [{ name: 'Pierre' }, { name: 'Paul' }, { name: 'Jacques' }]
})
```

### Using different puppeteer libraries

If you want to use different puppeteer library you must provide the puppeteer property.

```js
const chrome = require('chrome-aws-lambda');
const nodeHtmlToImage = require('node-html-to-image')
const puppeteerCore = require('puppeteer-core');

const image = await nodeHtmlToImage({
  html: '<html><body><div>Hello</div></body></html>',
  puppeteer: puppeteerCore,
  puppeteerArgs: {
      args: chromium.args,
      executablePath: await chrome.executablePath,
  }
})
```

## Run tests

```sh
yarn test
```

## Related

### Libraries

- [node-html-to-image-cli](https://github.com/frinyvonnick/node-html-to-image-cli) - CLI for this module

### Articles 

- [Generate images from HTML in Node.js](https://yvonnickfrin.dev/node-html-to-image)
- [node-html-to-image v1.2 is out 🎉](https://dev.to/yvonnickfrin/node-html-to-image-v1-2-is-out-42f4)

## Author

### Updates for Concurrency + Puppeteer Clustering

👤 **Matthew Fritz <hello@matthewfritz.net>**

* GitHub: [@matthewfritz](https://github.com/matthewfritz)

### Original Package

👤 **FRIN Yvonnick <frin.yvonnick@gmail.com>**

* Website: [https://yvonnickfrin.dev](https://yvonnickfrin.dev)
* Twitter: [@yvonnickfrin](https://twitter.com/yvonnickfrin)
* Github: [@frinyvonnick](https://github.com/frinyvonnick)

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2019 [FRIN Yvonnick <frin.yvonnick@gmail.com>](https://github.com/frinyvonnick).<br />
This project is [Apache--2.0](https://github.com/frinyvonnick/node-html-to-image/blob/master/LICENSE) licensed.

***
_The [original version of this README](https://github.com/frinyvonnick/node-html-to-image/blob/master/README.md) was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
