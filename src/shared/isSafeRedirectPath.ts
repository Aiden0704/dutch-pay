const SAFE_REDIRECT_PATTERN = /^\/(?!\/)[A-Za-z0-9/_\-.?=&%]*$/;

export function isSafeRedirectPath(
  path: string | null | undefined
): path is string {
  return !!path && SAFE_REDIRECT_PATTERN.test(path);
}
