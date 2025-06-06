<template>
  <div class="px-2">
    <NaviTree :links="navigationLinks" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { NaviTree } from '@annebrown.ca/vue3-fleet-pub'; 


interface NavigationLink {
  label: string;
  to?: string; 
  children?: NavigationLink[];
  collapsible?: boolean;
}

const props = defineProps<{
  sourcePrefix: string;
}>();

const navigationLinks = ref<NavigationLink[]>([]);

// --- Helper Functions for buildNavigationTree ---

const formatPathSegment = (segment: string): string => {
  if (!segment) return '';
  segment = segment.replace(/^\d+\.\s*/, ''); // Remove numbering (e.g., '1. ')
  return segment.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()); // Convert hyphens to spaces, capitalize first letter
};

const getNuxtRoutePath = (id: string, sourcePrefix: string): string => {
  const parts = id.split('/');
  const collectionName = parts[0]; 
  let contentPathSegments = parts.slice(1); 
  
  if (contentPathSegments.length > 0 && contentPathSegments[0] === collectionName) {
      contentPathSegments.shift();
  }
  
  let routePath = contentPathSegments.join('/');
  
  // 1. Remove .md extension
  routePath = routePath.replace(/\.md$/, ''); 
  
  // 2. Handle '/index' suffix to get the clean directory URL
  if (routePath.endsWith('/index')) {
    routePath = routePath.slice(0, -6); // Remove '/index'
  }
  
  // If, after processing, the routePath is empty (e.g., for the root index file like 'docs/index.md'),
  // return just the sourcePrefix (e.g., '/docs')
  if (routePath === '') {
    return sourcePrefix;
  }

  // Combine sourcePrefix and the derived routePath
  return `${sourcePrefix}/${routePath}`;
}; // getNuxtRoutePath()

// --- THE MYSTERY FUNCTION: buildNavigationTree ---
const buildNavigationTree = (items: any[], basePrefix: string): NavigationLink[] => {
  const tree: NavigationLink[] = [];
  const pathToNode: { [key: string]: NavigationLink } = {}; 
  const collectionName = basePrefix.replace(/^\//, ''); 

  // First, process items to get their correct _path and _dir flags
  const processedItems = items.map(item => ({
    ...item,
    _path: getNuxtRoutePath(item.id, basePrefix),
    _dir: item._dir || item.id.endsWith('index.md') // Flag items ending in index.md as directories for internal logic
  }));

  // Filter out any items that didn't get a valid _path (shouldn't happen often if IDs are good)
  const filteredProcessedItems = processedItems.filter(item => item._path);
  // Sort by _path to ensure consistent tree building order
  filteredProcessedItems.sort((a, b) => a._path.localeCompare(b._path));

  filteredProcessedItems.forEach(item => {
    const fullPath = item._path; 
    // Extract path segments relative to the basePrefix
    const pathSegments = fullPath.replace(new RegExp(`^${basePrefix}/?`), '').split('/').filter(s => s);

    let currentLevelNodes = tree;
    let currentPathAccumulator = basePrefix; 

    // Iterate through segments to build nested structure
    pathSegments.forEach((segment, index) => {
      const isLastSegment = index === pathSegments.length - 1;
      const segmentFullPath = `${currentPathAccumulator}/${segment}`; 

      // If this segment node doesn't exist yet, create it
      if (!pathToNode[segmentFullPath]) {
        const newNode: NavigationLink = {
          label: formatPathSegment(segment), // Format label from segment
          to: undefined, // Default to undefined; set later if it's a file or index
          children: [], // Assume it's a directory until proven otherwise
          collapsible: true
        };
        pathToNode[segmentFullPath] = newNode;
        currentLevelNodes.push(newNode);
      }

      const node = pathToNode[segmentFullPath];

      // If this is the actual content item (last segment) and it's not a directory marker (like index.md)
      if (isLastSegment && !item._dir) { 
        node.to = fullPath; // This node is a clickable file
        node.label = item.title || formatPathSegment(segment); // Use frontmatter title if available
        node.children = undefined; // It's a file, so no children
      } else if (item._path === segmentFullPath && item.title && item._dir) {
        // If this item is an index.md file representing a directory's root,
        // assign its title and path to the directory node
        node.label = item.title;
        node.to = fullPath;
      }

      // Move to the next level's children
      currentLevelNodes = node.children || [];
      currentPathAccumulator = segmentFullPath; 
    });
  }); 

  // --- Internal Sorting Logic from buildNavigationTree ---
  // This sorts directories before files (or alphabetically by label)
  const sortTree = (nodes: NavigationLink[]) => {
    nodes.sort((a, b) => {
      const isADir = a.children && a.children.length > 0;
      const isBDir = b.children && b.children.length > 0;

      // Directories come before files
      if (isADir && !isBDir) return -1;
      if (!isADir && isBDir) return 1;

      // Otherwise, sort alphabetically by label
      return a.label.localeCompare(b.label);
    });
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortTree(node.children); // Recursively sort children
      }
    });
  };

  sortTree(tree); // Apply initial sorting

  return tree;
}; // buildNavigationTree()

/**
 * Recursively processes the navigation tree to handle 'index' child entries.
 * If a directory has an 'index' child (with a 'to' link), its 'to' link is moved
 * to the parent directory, and the 'index' child is removed from the tree.
 *
 * @param links The array of NavigationLink objects (children of a parent or root).
 * @returns The processed array of NavigationLink objects.
 */
function processNavigationTree(links: NavigationLink[]): NavigationLink[] {
  if (!links || links.length === 0) {
    return [];
  }

  return links.map(link => {
    if (link.children && link.children.length > 0) {
      const indexChildIndex = link.children.findIndex(
        child => child.label.toLowerCase() === 'index' && child.to
      );

      if (indexChildIndex !== -1) {
        const indexChild = link.children[indexChildIndex];
        
        // If the directory itself doesn't have a 'to' link,
        // assign the index child's 'to' link to the parent directory.
        if (!link.to) {
          link.to = indexChild.to;
        }
        
        // Remove the 'index' child from the parent's children array.
        link.children.splice(indexChildIndex, 1);
      }

      // Recursively process the remaining children of this directory.
      link.children = processNavigationTree(link.children);
    }
    return link;
  });
}

// --- Fetching and Building Navigation ---

const fetchAndBuildNavigation = async () => {
  if (!props.sourcePrefix) {
    console.warn('SourcePrefix is required for SourceNaviTree.');
    return;
  }

  try {
    const collectionName = props.sourcePrefix.replace(/^\//, '');

    // queryCollection is an official Nuxt Content v3 API, used correctly here
    const rawContent = await queryCollection(collectionName).all(); 
    const content = Array.isArray(rawContent) ? rawContent : [];
    const allItems = [...content];
    
    // Sort raw items by 'id' before building the tree (your existing logic)
    allItems.sort((a, b) => {
      const idA = a.id || ''; 
      const idB = b.id || '';
      return idA.localeCompare(idB);
    });

    // 1. Build the initial navigation tree using your custom buildNavigationTree function
    let builtTree = buildNavigationTree(allItems, props.sourcePrefix); 

    // 2. Process the tree to remove 'index' children and assign their links to parents
    builtTree = processNavigationTree(builtTree); 

    // 3. Assign the final, processed tree to navigationLinks
    navigationLinks.value = builtTree;

  } catch (error) {
    console.error('Error fetching or building content navigation:', error);
    navigationLinks.value = [{ label: 'Error loading content navigation', collapsible: false }];
  }
};

// Watch for changes in sourcePrefix and re-fetch/build navigation immediately
watch(() => props.sourcePrefix, fetchAndBuildNavigation, { immediate: true });

// Also fetch/build navigation when the component is mounted
onMounted(() => {
  fetchAndBuildNavigation();
});
</script>