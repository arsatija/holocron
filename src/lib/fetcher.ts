/**
 * Global fetcher function for making API requests
 * @param args - Arguments to pass to fetch
 * @returns Promise with the JSON response
 */
export const fetcher = (...args: Parameters<typeof fetch>) =>
    fetch(...args).then((res) => res.json());
