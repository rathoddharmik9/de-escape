console.log("--> Loaded mocked next/headers!");

let virtualCookies: Record<string, string> = {};

export function setVirtualCookie(name: string, value: string) {
  virtualCookies[name] = value;
}

export function clearVirtualCookies() {
  virtualCookies = {};
}

export function cookies() {
  return {
    getAll() {
      return Object.entries(virtualCookies).map(([name, value]) => ({ name, value }));
    },
    get(name: string) {
      return virtualCookies[name] ? { name, value: virtualCookies[name] } : undefined;
    },
    set(name: string, value: string, options?: any) {
      virtualCookies[name] = value;
    },
    delete(name: string) {
      delete virtualCookies[name];
    }
  };
}
