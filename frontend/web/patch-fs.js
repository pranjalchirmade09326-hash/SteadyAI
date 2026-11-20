// Windows NTFS concurrent mkdir race condition patch for Next.js / Webpack
const fs = require('fs');
const path = require('path');

// Propagate to any child processes forked by Next.js / jest-worker
// Use forward slashes so Node.js on Windows parses NODE_OPTIONS without escape corruption
const patchScriptPath = path.resolve(__filename).replace(/\\/g, '/');
const flag = `--require "${patchScriptPath}"`;
if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes(patchScriptPath)) {
  process.env.NODE_OPTIONS = process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ${flag}` : flag;
}

if (!fs.__mkdirPatched) {
  fs.__mkdirPatched = true;

  const origMkdirSync = fs.mkdirSync;
  const origMkdir = fs.mkdir;
  const origPromisesMkdir = fs.promises.mkdir;

  function isRetryable(err) {
    return err && (err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EACCES');
  }

  function sleepSync(ms) {
    try {
      const sab = new SharedArrayBuffer(4);
      const int32 = new Int32Array(sab);
      Atomics.wait(int32, 0, 0, ms);
    } catch {
      const start = Date.now();
      while (Date.now() - start < ms) {}
    }
  }

  fs.mkdirSync = function (p, options) {
    const maxRetries = 25;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return origMkdirSync.call(fs, p, options);
      } catch (err) {
        if (isRetryable(err)) {
          try {
            if (fs.existsSync(p)) {
              return undefined;
            }
          } catch {}
          if (i === maxRetries - 1) throw err;
          sleepSync(50);
        } else {
          throw err;
        }
      }
    }
  };

  fs.mkdir = function (p, options, callback) {
    let cb = typeof options === 'function' ? options : callback;
    let opt = typeof options === 'function' ? undefined : options;

    const retry = (attemptsLeft) => {
      origMkdir.call(fs, p, opt, (err, result) => {
        if (err && isRetryable(err)) {
          try {
            if (fs.existsSync(p)) {
              return cb ? cb(null, result) : undefined;
            }
          } catch {}
          if (attemptsLeft > 0) {
            setTimeout(() => retry(attemptsLeft - 1), 50);
            return;
          }
        }
        if (cb) cb(err, result);
      });
    };

    retry(25);
  };

  fs.promises.mkdir = async function (p, options) {
    const maxRetries = 25;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await origPromisesMkdir.call(fs.promises, p, options);
      } catch (err) {
        if (isRetryable(err)) {
          try {
            if (fs.existsSync(p)) {
              return undefined;
            }
          } catch {}
          if (i === maxRetries - 1) throw err;
          await new Promise((resolve) => setTimeout(resolve, 50));
        } else {
          throw err;
        }
      }
    }
  };
}
