/* Convert bytes to string.
 *
 * |Name  |Type  |Desc         |
 * |------|------|-------------|
 * |str   |array |Bytes array  |
 * |return|string|Result string|
 */

/* example
 * bytesToStr([108, 105, 99, 105, 97]); // -> 'licia'
 */

/* module
 * env: all
 * test: all
 */

/* typescript
 * export default function bytesToStr(bytes: number[]): string
 */

function exports(bytes) {
    const str = [];

    for (let i = 0, len = bytes.length; i < len; i++) {
        str.push(String.fromCharCode(bytes[i]));
    }

    return str.join('');
}
