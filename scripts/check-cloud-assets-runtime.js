const assert = require('assert');

const originalWarn = console.warn;
let serverCalls = 0;
let clientCalls = 0;
let events = [];

global.wx = {
  cloud: {
    callFunction: null,
    getTempFileURL: null,
  },
};

const cloudAssets = require('../utils/cloud-assets');

function fileID(name) {
  return `cloud://test-env.test-bucket/assets/${name}.png`;
}

function reset() {
  serverCalls = 0;
  clientCalls = 0;
  events = [];
  cloudAssets.clearTempFileURLCache();
}

function setServerSuccess() {
  wx.cloud.callFunction = ({ data, success }) => {
    serverCalls += 1;
    events.push('server');
    success({
      result: {
        fileList: data.fileIDs.map((id) => ({
          fileID: id,
          status: 0,
          errMsg: 'ok',
          tempFileURL: `https://signed.example/${encodeURIComponent(id)}`,
        })),
      },
    });
  };
}

function setServerFailure() {
  wx.cloud.callFunction = ({ fail }) => {
    serverCalls += 1;
    events.push('server');
    fail({ errMsg: 'forced server failure' });
  };
}

function setClientSuccess() {
  wx.cloud.getTempFileURL = ({ fileList, success }) => {
    clientCalls += 1;
    events.push('client');
    success({
      fileList: fileList.map((id) => ({
        fileID: id,
        status: 0,
        errMsg: 'ok',
        tempFileURL: `https://client.example/${encodeURIComponent(id)}`,
      })),
    });
  };
}

function setClientFailure() {
  wx.cloud.getTempFileURL = ({ fail }) => {
    clientCalls += 1;
    events.push('client');
    fail({ errMsg: 'forced client failure' });
  };
}

async function run() {
  console.warn = () => {};

  reset();
  setServerSuccess();
  setClientFailure();
  const primaryID = fileID('server-primary');
  const primaryMap = await cloudAssets.getTempFileURLMap([primaryID]);
  assert(primaryMap[primaryID].startsWith('https://signed.example/'));
  assert.deepStrictEqual(events, ['server']);
  assert.strictEqual(serverCalls, 1);
  assert.strictEqual(clientCalls, 0);

  reset();
  setServerFailure();
  setClientSuccess();
  const fallbackID = fileID('client-fallback');
  const fallbackMap = await cloudAssets.getTempFileURLMap([fallbackID]);
  assert(fallbackMap[fallbackID].startsWith('https://client.example/'));
  assert.deepStrictEqual(events, ['server', 'client']);

  reset();
  setServerFailure();
  setClientFailure();
  const failedMap = await cloudAssets.getTempFileURLMap([fileID('unavailable')]);
  assert.deepStrictEqual(failedMap, {});

  reset();
  setServerSuccess();
  setClientFailure();
  const batchIDs = Array.from({ length: 51 }, (_, index) => fileID(`batch-${index}`));
  const batchMap = await cloudAssets.getTempFileURLMap(batchIDs);
  assert.strictEqual(Object.keys(batchMap).length, 51);
  assert.strictEqual(serverCalls, 2);
  assert.strictEqual(clientCalls, 0);

  console.log('OK cloud assets use server signing first, client fallback, 50-item batches and text-safe failure');
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    console.warn = originalWarn;
  });
