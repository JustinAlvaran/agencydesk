/**
 * Build-time utility function to fetch data from DirectUS CMS
 * Designed for Next.js static site generation (SSG) with data baked at build time
 * 
 * This utility should only be used in:
 * - getStaticProps()
 * - getStaticPaths()
 * - generateStaticParams() (App Router)
 * 
 * @template T - The expected return data type
 * @param collection - The DirectUS collection name to fetch from
 * @param options - Configuration options for the API request
 * @returns Promise resolving to typed data array
 * @throws Error if the API request fails during build
 * 
 * @example
 * interface BlogPost {
 *   id: string;
 *   title: string;
 *   slug: string;
 *   content: string;
 * }
 * 
 * export async function getStaticProps() {
 *   const posts = await fetchFromDirectusBuildTime<BlogPost>('posts', {
 *     fields: ['id', 'title', 'slug', 'content'],
 *     filter: { status: { _eq: 'published' } },
 *     sort: ['-created_on']
 *   });
 *   
 *   return {
 *     props: { posts },
 *     revalidate: false // Data is static, no revalidation needed
 *   };
 * }
 */

interface DirectusApiOptions {
  /** Comma-separated list of fields to retrieve */
  fields?: string[];
  /** Filter conditions for the query */
  filter?: Record<string, unknown>;
  /** Sort order (e.g., ['-created_on']) */
  sort?: string[];
  /** Number of items to limit results to */
  limit?: number;
  /** Number of items to skip for pagination */
  offset?: number;
  /** Search query across all fields */
  search?: string;
}

interface DirectusResponse<T> {
  data: T[];
  meta?: {
    total_count?: number;
    filter_count?: number;
  };
}

/**
 * Fetches data from DirectUS CMS API at build time
 * Data is fetched once during the Next.js build process and baked into static files
 * 
 * This should only be called from getStaticProps() or generateStaticParams()
 * 
 * @template T - The type of data being fetched
 * @param collection - The name of the DirectUS collection
 * @param options - Query and filter options
 * @returns Promise containing the typed data array
 */
export async function fetchFromDirectusBuildTime<T>(
  collection: string,
  options?: DirectusApiOptions
): Promise<T[]> {
  if (!collection) {
    throw new Error('Collection name is required');
  }

  const baseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
  const token = process.env.DIRECTUS_API_TOKEN;

  if (!baseUrl) {
    throw new Error(
      'NEXT_PUBLIC_DIRECTUS_URL environment variable is not set. Required for build-time data fetching.'
    );
  }

  if (!token) {
    throw new Error(
      'DIRECTUS_API_TOKEN environment variable is not set. Required for build-time data fetching.'
    );
  }

  try {
    console.log(
      `[Build Time] Fetching data from DirectUS collection: ${collection}`
    );

    const url = buildDirectusUrl(baseUrl, collection, options);
    console.log(`[Build Time] Request URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // No caching at build time - we want fresh data
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(
        `DirectUS API error: ${response.status} ${response.statusText}`
      );
    }

    const result: DirectusResponse<T> = await response.json();
    const dataCount = result.data?.length || 0;

    console.log(
      `[Build Time] Successfully fetched ${dataCount} items from collection: ${collection}`
    );

    return result.data || [];
  } catch (error) {
    console.error(
      `[Build Time] Failed to fetch from DirectUS collection "${collection}":`,
      error
    );
    throw error;
  }
}

/**
 * Builds a complete DirectUS API URL with query parameters
 * 
 * @param baseUrl - The base DirectUS URL
 * @param collection - The collection name
 * @param options - Query options
 * @returns Complete URL with encoded query parameters
 */
function buildDirectusUrl(
  baseUrl: string,
  collection: string,
  options?: DirectusApiOptions
): string {
  const url = new URL(`${baseUrl}/items/${collection}`);

  if (!options) {
    return url.toString();
  }

  if (options.fields && options.fields.length > 0) {
    url.searchParams.append('fields', options.fields.join(','));
  }

  if (options.sort && options.sort.length > 0) {
    url.searchParams.append('sort', options.sort.join(','));
  }

  if (options.limit !== undefined) {
    url.searchParams.append('limit', options.limit.toString());
  }

  if (options.offset !== undefined) {
    url.searchParams.append('offset', options.offset.toString());
  }

  if (options.search) {
    url.searchParams.append('search', options.search);
  }

  if (options.filter && Object.keys(options.filter).length > 0) {
    url.searchParams.append('filter', JSON.stringify(options.filter));
  }

  return url.toString();
}

/**
 * Type-safe utility for fetching paginated data from DirectUS at build time
 * Useful for generating static pages with sorted/filtered content
 * 
 * @template T - The type of items being paginated
 * @param collection - The collection to query
 * @param pageSize - Number of items per page
 * @param page - Page number (1-indexed)
 * @param options - Additional query options
 * @returns Promise with paginated items and metadata
 */
export async function fetchPaginatedFromDirectusBuildTime<T>(
  collection: string,
  pageSize: number = 10,
  page: number = 1,
  options?: Omit<DirectusApiOptions, 'limit' | 'offset'>
): Promise<{ items: T[]; total: number; pageCount: number }> {
  const offset = (page - 1) * pageSize;

  const items = await fetchFromDirectusBuildTime<T>(collection, {
    ...options,
    limit: pageSize,
    offset,
  });

  // Get total count by fetching all items with same filters but no limit
  const allItems = await fetchFromDirectusBuildTime<{ id: string }>(
    collection,
    {
      fields: ['id'],
      filter: options?.filter,
    }
  );

  const total = allItems.length;

  return {
    items,
    total,
    pageCount: Math.ceil(total / pageSize),
  };
}