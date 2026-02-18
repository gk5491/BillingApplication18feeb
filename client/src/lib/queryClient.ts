import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const orgId = localStorage.getItem("organizationId") || "1";
  const authStorage = localStorage.getItem("auth-storage");
  let token = null;
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      token = parsed.state?.token;
    } catch (e) {
      console.error("Error parsing auth-storage", e);
    }
  }

  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "x-organization-id": orgId,
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const orgId = localStorage.getItem("organizationId") || "1";
      const authStorage = localStorage.getItem("auth-storage");
      let token = null;
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          token = parsed.state?.token;
        } catch (e) {
          console.error("Error parsing auth-storage", e);
        }
      }

      let url = queryKey[0] as string;
      if (queryKey.length > 1 && typeof queryKey[1] === "object") {
        const queryParams = new URLSearchParams();
        const params = queryKey[1] as Record<string, any>;
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
        const queryString = queryParams.toString();
        if (queryString) {
          url += (url.includes("?") ? "&" : "?") + queryString;
        }
      } else if (queryKey.length > 1) {
        url = queryKey.join("/");
      }

      const res = await fetch(url, {
        headers: {
          "x-organization-id": orgId,
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
