<template>
  <div class="px-2">
    <NaviTree :links="pagesNavigationLinks" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router'; // Correct way to access router in Nuxt 3
// IMPORTANT: Replace 'your-vue3-fleet-pub-package-name' with the actual 'name' from vue3-fleet-pub's package.json
// and adjust path to where NaviTree.vue is exposed in its 'dist' folder.
  import { NaviTree } from '@annebrown.ca/vue3-fleet-pub'; 

interface NavigationLink {
  label: string;
  to?: string;
  icon?: string;
  children?: NavigationLink[];
  collapsible?: boolean;
}

const router = useRouter(); // Access the Nuxt router

const pagesNavigationLinks = ref<NavigationLink[]>([]);

/**
 * Helper function to format a route path segment into a human-readable label.
 */
const formatRouteSegment = (segment: string): string => {
  if (!segment) return 'Home';
  // Remove dynamic route prefixes like :id or [id]
  let formatted = segment.replace(/^[:\[].*?[\]]$/, '');
  // Replace hyphens with spaces and capitalize the first letter of each word
  formatted = formatted.replace(/-/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  return formatted;
};

/**
 * Builds a hierarchical navigation tree from Nuxt router routes.
 * This function processes the routes to create nested structures suitable for NaviTree.
 */
const buildPagesNavigationTree = (routes: any[]): NavigationLink[] => {
  const tree: NavigationLink[] = [];
  const pathToNode: { [key: string]: NavigationLink } = {}; // Map to track created nodes by path

  routes.forEach(route => {
    // Only include routes that have a path and are not hidden (e.g., meta: { hidden: true })
    if (!route.path || route.meta?.hidden) return;

    // Normalize path: remove leading slash and trailing slashes for consistent segmenting
    const normalizedPath = route.path.replace(/^\//, '').replace(/\/$/, '');
    const segments = normalizedPath.split('/').filter(s => s !== '');

    let currentPath = '';
    let parentNode: NavigationLink | null = null;

    segments.forEach((segment, index) => {
      // Reconstruct path for current segment (e.g., 'about' -> '/about', 'about/team' -> '/about/team')
      currentPath = `/${segments.slice(0, index + 1).join('/')}`;
      let node = pathToNode[currentPath];

      if (!node) {
        node = {
          label: route.meta?.title || formatRouteSegment(segment), // Use meta.title if available
          collapsible: true, // Assume sections are collapsible
          children: []
        };

        // If this is the last segment, it's a page (leaf node)
        const isPage = index === segments.length - 1;

        if (isPage) {
          node.to = route.path; // Set the full route path
          node.children = undefined; // Pages don't have children in the navigation
          node.collapsible = false; // Pages themselves are not collapsible
        }

        pathToNode[currentPath] = node; // Store node in map

        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = [];
          }
          parentNode.children.push(node);
        } else {
          // If no parent, it's a top-level item. Add to main tree if not already added.
          if (index === 0 && !tree.some(existingNode => existingNode.label === node?.label && existingNode.to === node?.to)) {
             tree.push(node);
          }
        }
      }

      parentNode = node; // Move to the next level
    });
  });

  // Sort function: directories first, then alphabetical by label
  const sortLinks = (links: NavigationLink[]) => {
      if (!links) return;
      links.sort((a, b) => {
          const aIsFile = !!a.to;
          const bIsFile = !!b.to;
          if (aIsFile && !bIsFile) return 1; // Files come after directories
          if (!aIsFile && bIsFile) return -1; // Directories come before files
          return a.label.localeCompare(b.label); // Then sort alphabetically
      });
      links.forEach(link => {
          if (link.children && link.children.length > 0) {
              sortLinks(link.children); // Recursively sort children
          }
      });
  };

  // Get top-level nodes, sort them, and ensure uniqueness
  const rootLinks = Object.values(pathToNode).filter(node => {
      const nodePath = node.to || (Object.keys(pathToNode).find(key => pathToNode[key] === node) || '');
      const segments = nodePath.split('/').filter(s => s !== '');
      return segments.length === 1 || nodePath === '/'; // Top-level segment or root page
  });

  sortLinks(rootLinks);
  const uniqueRootLinks = Array.from(new Map(rootLinks.map(item => [item.to || item.label, item])).values());
  sortLinks(uniqueRootLinks); // Re-sort after making unique

  return uniqueRootLinks;
};


/**
 * Fetches Nuxt application routes and builds the navigation tree.
 */
const fetchAndBuildPagesNavigation = async () => {
  // Access all routes from the router instance
  const routes = router.getRoutes();

  // Filter out unwanted routes (e.g., dynamic segments without concrete paths, 404 pages)
  const filteredRoutes = routes.filter(route => 
    route.path !== '/' && // Don't include the root path here if you have a separate Home link
    !route.path.includes(':') && // Exclude dynamic routes like /users/:id
    !route.path.includes('[') && // Exclude bracketed dynamic routes like /posts/[slug]
    !route.path.includes('*') && // Exclude catch-all routes
    !route.meta?.hidden // Exclude routes marked with meta: { hidden: true }
  );
  
  // You might want to manually add a root 'Home' link if '/' is excluded above
  const homeLink: NavigationLink = { label: 'Home', to: '/' };
  
  const builtTree = buildPagesNavigationTree(filteredRoutes);
  
  // Add Home link at the beginning if not already present
  if (!builtTree.some(link => link.to === '/')) {
    builtTree.unshift(homeLink);
  }

  pagesNavigationLinks.value = builtTree;
};

// Fetch pages navigation when the component is mounted
onMounted(() => {
  fetchAndBuildPagesNavigation();
});

// Optionally, watch for route changes if you want the navigation to update dynamically
// (e.g., if routes are added/removed dynamically, though rare for static pages)
// watch(router.getRoutes, fetchAndBuildPagesNavigation, { immediate: true });
</script>

<style scoped>
/* Any Nuxt app-specific styling for this wrapper component */
</style>