/* Binary file storage.
 *
 * Most api is the same as Store module, except only buffer is accepted.
 *
 * ### save
 *
 * Save data to disk.
 */

/* example
 * const store = new FileBlobStore('path/to/file');
 * store.set('name', Buffer.from('licia'));
 * process.on('exit', () => store.save());
 */

/* module
 * env: node
 * since: 1.32.0
 */

/* typescript
 * export declare class FileBlobStore extends Emitter {
 *     constructor(path: string, data?: types.PlainObj<Buffer>);
 *     set(key: string, buf: Buffer): void;
 *     set(values: types.PlainObj<Buffer>): void;
 *     get(key: string): Buffer | void;
 *     get(keys: string[]): types.PlainObj<Buffer>;
 *     remove(key: string): void;
 *     remove(keys: string[]): void;
 *     clear(): void;
 *     each(fn: (val: Buffer, key: string) => void): void;
 *     save(): void;
 * }
 */

_('types isStr isObj each Emitter toArr unique concat keys');

const fs = require('fs');

exports = Emitter.extend({
    initialize: function FileBlobStore(path, data) {
        this.callSuper(Emitter, 'initialize', arguments);
        this._path = path;
        this._mapPath = path + '.MAP';
        this._lockPath = path + '.LOCK';
        this._data = data || {};

        let storedBlob = Buffer.alloc(0);
        let storedBlobMap = {};
        if (fs.existsSync(path) && fs.existsSync(this._mapPath)) {
            try {
                storedBlob = fs.readFileSync(path);
                storedBlobMap = JSON.parse(fs.readFileSync(this._mapPath));
            } catch (e) {
                storedBlobMap = {};
                storedBlob = Buffer.alloc(0);
            }
        }
        this._storedBlob = storedBlob;
        this._storedBlobMap = storedBlobMap;
    },
    set(key, buf) {
        let data;

        if (isStr(key)) {
            data = {};
            data[key] = buf;
        } else if (isObj(key)) {
            data = key;
        }

        each(data, (buf, key) => {
            const oldBuf = this.get(key);
            this._data[key] = buf;
            this.emit('change', key, buf, oldBuf);
        });
    },
    get(key) {
        if (isStr(key)) {
            return this._get(key);
        }

        const ret = {};
        each(key, val => {
            ret[val] = this._get(val);
        });

        return ret;
    },
    remove(key) {
        key = toArr(key);
        const data = this._data;
        const storedBlobMap = this._storedBlobMap;

        each(key, val => {
            delete data[val];
            delete storedBlobMap[val];
        });
    },
    clear() {
        this._data = {};
        this._storedBlob = Buffer.alloc(0);
        this._storedBlobMap = {};
    },
    each(fn) {
        const allKeys = this._getKeys();

        each(allKeys, key => {
            fn(this._get(key), key);
        });
    },
    save() {
        const dump = this._getDump();
        const blobToStore = Buffer.concat(dump[0]);
        const mapToStore = JSON.stringify(dump[1]);

        let lock = false;
        try {
            fs.writeFileSync(this._lockPath, 'LOCK', { flag: 'wx' });
            lock = true;

            fs.writeFileSync(this._path, blobToStore);
            fs.writeFileSync(this._mapPath, mapToStore);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        } finally {
            if (lock) {
                fs.unlinkSync(this._lockPath);
            }
        }
    },
    _get(key) {
        return this._data[key] || this._getFromStorage(key);
    },
    _getFromStorage(key) {
        if (!this._storedBlobMap[key]) {
            return;
        }

        const [start, end] = this._storedBlobMap[key];
        return this._storedBlob.slice(start, end);
    },
    _getDump() {
        const buffers = [];
        const blobMap = {};
        let curBufStart = 0;

        function dump(buf, key) {
            buffers.push(buf);
            const len = buf.length;
            blobMap[key] = [curBufStart, curBufStart + len];
            curBufStart += len;
        }

        this.each(dump);

        return [buffers, blobMap];
    },
    _getKeys() {
        return unique(concat(keys(this._data), keys(this._storedBlobMap)));
    }
});
