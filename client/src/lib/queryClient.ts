import { QueryClient, QueryFunction } from "@tanstack/react-query";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://cvnalogvvfzapxmozdyh.supabase.co";

// Get access token from localStorage
function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

// Map local API routes to Supabase edge functions
function mapToEdgeFunction(path: string): string {
  const token = getAccessToken();
  const baseUrl = `${SUPABASE_URL}/functions/v1`;

  if (path.includes("/profile")) return `${baseUrl}/profile`;
  if (path.includes("/jobs")) return `${baseUrl}/jobs-api`;
  if (path.includes("/documents")) return `${baseUrl}/documents-api`;
  if (path.includes("/applications")) return `${baseUrl}/applications-api`;
  if (path.includes("/job-tracker")) return `${baseUrl}/job-tracker`;
  if (path.includes("/ocr-extract")) return `${baseUrl}/ocr-extract`;
  if (path.includes("/job-scraper")) return `${baseUrl}/job-scraper`;
  
  // Fallback to original path for cache endpoints
  return path;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: RequestInit,
): Promise<any> {
  const token = getAccessToken();
  const headers = { ...options?.headers };

  // Add auth token if available
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const edgeFunctionUrl = mapToEdgeFunction(url);
  
  const res = await fetch(edgeFunctionUrl, {
    credentials: "include",
    ...options,
    headers,
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = getAccessToken();
    const path = queryKey.join("/") as string;
    const url = mapToEdgeFunction(path);
    const headers: any = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      credentials: "include",
      headers,
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
