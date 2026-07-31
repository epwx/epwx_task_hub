export function getApiBaseUrl() {
  // In browser, force same-origin and rely on Next.js /api rewrite.
  if (typeof window !== 'undefined') {
    return '';
  }

  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
}

export function withApiBase(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
