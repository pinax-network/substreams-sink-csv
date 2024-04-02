

export function isRemotePath(path: string): boolean {
    return path.startsWith("http://") || path.startsWith("https://");
  }