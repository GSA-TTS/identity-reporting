/**
 * preact-router does not parse "+" as spaces the way JS encodes them
 */
function pathWithParams(path: string, searchParams: URLSearchParams): string {
  return `${path}?${searchParams.toString().replace(/\+/g, "%20")}`;
}

export { pathWithParams };
