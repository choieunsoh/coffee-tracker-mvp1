import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Store } from 'express-session';

const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

/**
 * Minimal file-based session store for express-session
 * Much lighter than session-file-store (no extra dependencies)
 */
export class FileSessionStore extends Store {
  constructor(options = {}) {
    super(options);
    this.dir = options.path || path.join(process.cwd(), 'data', 'sessions');
    this.ensureDir();
  }

  async ensureDir() {
    try {
      await mkdir(this.dir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }

  get(sid, callback = () => {}) {
    const filePath = this.getFilePath(sid);
    readFile(filePath, 'utf8')
      .then((data) => {
        callback(null, JSON.parse(data));
      })
      .catch((err) => {
        if (err.code === 'ENOENT') {
          callback(null, null); // Session not found
        } else {
          callback(err);
        }
      });
  }

  set(sid, session, callback = () => {}) {
    const filePath = this.getFilePath(sid);
    // Don't save if session is too old (already expired)
    if (session && session.cookie && session.cookie.expires) {
      const now = new Date();
      const expires = new Date(session.cookie.expires);
      if (expires < now) {
        return callback(null);
      }
    }

    this.ensureDir()
      .then(() => writeFile(filePath, JSON.stringify(session), 'utf8'))
      .then(() => callback(null))
      .catch(callback);
  }

  destroy(sid, callback = () => {}) {
    const filePath = this.getFilePath(sid);
    unlink(filePath)
      .then(() => callback(null))
      .catch((err) => {
        if (err.code === 'ENOENT') {
          callback(null); // Already gone
        } else {
          callback(err);
        }
      });
  }

  all(callback = () => {}) {
    fs.readdir(this.dir, (err, files) => {
      if (err) return callback(err);

      const sessions = [];
      let pending = files.length;
      if (pending === 0) return callback(null, sessions);

      files.forEach((file) => {
        const filePath = path.join(this.dir, file);
        readFile(filePath, 'utf8')
          .then((data) => {
            try {
              sessions.push(JSON.parse(data));
            } catch (e) {
              // Skip invalid files
            }
            if (--pending === 0) callback(null, sessions);
          })
          .catch((err) => {
            if (--pending === 0) callback(null, sessions);
          });
      });
    });
  }

  length(callback = () => {}) {
    fs.readdir(this.dir, (err, files) => {
      if (err) return callback(err);
      callback(null, files.length);
    });
  }

  clear(callback = () => {}) {
    fs.readdir(this.dir, (err, files) => {
      if (err) return callback(err);

      let pending = files.length;
      if (pending === 0) return callback(null);

      files.forEach((file) => {
        const filePath = path.join(this.dir, file);
        unlink(filePath)
          .then(() => {
            if (--pending === 0) callback(null);
          })
          .catch((err) => {
            if (--pending === 0) callback(null);
          });
      });
    });
  }

  getFilePath(sid) {
    return path.join(this.dir, `${sid}.json`);
  }
}

export default FileSessionStore;
