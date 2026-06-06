/**
 * Converts a potentially relative image path from Django to an absolute URL
 * compatible with Next.js <Image> component.
 */
export function getImageUrl(path: string | undefined | null): string {
  if (!path) return "";
  
  // If it's already an absolute URL (http://, https://, or data:), return as is
  if (path.startsWith("http") || path.startsWith("data:")) {
    return path;
  }
  
  // Otherwise, prepend the backend host (for local dev, it's localhost:8000)
  // In production, this would use an environment variable like process.env.NEXT_PUBLIC_BACKEND_URL
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  
  // Ensure we don't double slash
  if (path.startsWith("/")) {
    return `${baseUrl}${path}`;
  }
  return `${baseUrl}/${path}`;
}
