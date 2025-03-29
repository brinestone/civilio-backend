import type { IncomingHttpHeaders } from 'http';

/**
 * Converts an object representing HTTP headers into a `Headers` instance.
 *
 * This function takes a record of headers where the keys are header names
 * and the values can either be strings or arrays of strings. If a value is
 * an array, it joins the array elements into a single string separated by
 * commas. The resulting headers are stored in a `Headers` object.
 *
 * @param headers - A record of HTTP headers where the keys are header names
 * and the values are either strings or arrays of strings.
 * @returns A `Headers` instance containing the converted headers.
 */
export function convertHeaders(headers: IncomingHttpHeaders) {
    return Object.entries(headers).reduce((acc, [k, v]) => {
        acc.set(k, !v ? '' : Array.isArray(v) ? v.join(',') : v);
        return acc;
    }, new Headers());
}