<template>
  <div class="px-2">
        <nav>
      <NaviTree
        :links="navigationLinks"
        ulClasses="list-none p-0 text-green-500"
        liClasses="m-0 p-0 text-green-600"
        ulChildrenClasses="ml-4 list-none p-0 text-green-500"
        :depth="0"              :initialExpansionLevel="1" />
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { NaviTree } from '@annebrown.ca/vue3-fleet-pub'; 

// queryCollection is automatically available in Nuxt 3 without explicit import.
// import { queryCollection } from '#content'; 

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

// --- Helper Functions ---

const formatPathSegment = (segment: string): string => {
  if (!segment) return '';
  segment = segment.replace(/^\d+\.\s*/, ''); 
  return segment.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

// --- buildNavigationTree (Refined Two-Pass for Root Node Handling + Detailed Logs) ---
const buildNavigationTree = (items: any[], basePrefix: string): NavigationLink[] => {
  const treeMap: { [path: string]: NavigationLink } = {}; // Maps full paths to NavigationLink nodes
  const rootNodes: NavigationLink[] = []; // This will hold the actual top-level nodes for THIS component (e.g., Arch, Docs-Sub-Dir)

  // Ensure items have a valid path and sort them for consistent processing.
  const processedItems = items.filter(item => item.path);
  processedItems.sort((a, b) => a.path.localeCompare(b.path)); // Sort alphabetically by path

  console.log('--- buildNavigationTree: Starting First Pass (Node Creation) ---');
  // --- First Pass: Create all individual nodes (directories from index.md, and regular files) ---
  // Populate treeMap with all potential nodes that will be part of the tree structure.
  processedItems.forEach(item => {
    const fullPath = item.path;
    const isIndexFile = item.id.endsWith('index.md');

    console.log(`[First Pass] Processing item: id="${item.id}", path="${fullPath}", title="${item.title || 'N/A'}", isIndexFile=${isIndexFile}`);

    if (isIndexFile) {
      // This item defines a directory node (e.g., /docs/arch from /docs/arch/index.md)
      console.log(`[First Pass]   --> This is an INDEX file. Creating/updating directory node for path: "${fullPath}"`);
      if (!treeMap[fullPath]) {
        treeMap[fullPath] = { label: '', children: [], collapsible: true, to: undefined };
        console.log(`[First Pass]     --> Created NEW directory node in treeMap for "${fullPath}"`);
      }
      // Set properties from the index.md file for the directory node.
      treeMap[fullPath].label = item.title || formatPathSegment(fullPath.split('/').pop() || '');
      treeMap[fullPath].to = fullPath; // The directory itself is clickable via its index.md
      treeMap[fullPath].collapsible = true; // Directories are always collapsible
      console.log(`[First Pass]     --> Node "${fullPath}" defined as directory: label="${treeMap[fullPath].label}", to="${treeMap[fullPath].to}"`);
    } else {
      // This is a regular content file (e.g., /docs/arch/file.md). It's a leaf node.
      console.log(`[First Pass]   --> This is a REGULAR content file. Creating leaf node for path: "${fullPath}"`);
      treeMap[fullPath] = {
        label: item.title || formatPathSegment(fullPath.split('/').pop()?.replace(/\.md$/, '') || ''),
        to: fullPath,
        children: undefined, // Leaf nodes have no children
        collapsible: false // Files are not collapsible
      };
      console.log(`[First Pass]     --> Node "${fullPath}" defined as leaf: label="${treeMap[fullPath].label}", to="${treeMap[fullPath].to}"`);
    }
  });
  console.log('--- buildNavigationTree: First Pass Completed. treeMap contents:', JSON.stringify(treeMap, null, 2));


  console.log('--- buildNavigationTree: Starting Second Pass (Hierarchy Assembly) ---');
  // --- Second Pass: Assemble the hierarchy (connect children to parents) ---
  processedItems.forEach(item => {
    const fullPath = item.path;
    const node = treeMap[fullPath]; // Get the node we created in the first pass

    if (!node) {
        console.warn(`[Second Pass] Node for path "${fullPath}" not found in treeMap. Skipping.`);
        return; 
    }

    // Calculate parent path (e.g., '/docs/arch' for item.path='/docs/arch/file.md')
    const lastSlashIndex = fullPath.lastIndexOf('/');
    const parentPath = lastSlashIndex > 0 ? fullPath.substring(0, lastSlashIndex) : '';

    console.log(`[Second Pass] Processing item: id="${item.id}", path="${fullPath}", parentPath="${parentPath}"`);

    // Condition to determine if it's a top-level node for *this component's output*.
    // This means it's a direct child of the `basePrefix` AND it's NOT the `basePrefix` itself.
    if (parentPath === basePrefix && fullPath !== basePrefix) {
        // These are the actual first-level entries to be displayed by SourceNaviTree (e.g., Arch, Docs-Sub-Dir).
        // They are children of the conceptual hidden root (`basePrefix`).
        console.log(`[Second Pass]   --> Adding "${node.label}" (path: ${fullPath}) to ROOT NODES (direct child of basePrefix).`);
        rootNodes.push(node);
    } else if (treeMap[parentPath]) {
        // This is a nested item (child of a node already in treeMap, and not a direct child of basePrefix)
        console.log(`[Second Pass]   --> Adding "${node.label}" (path: ${fullPath}) as child to parent "${treeMap[parentPath].label}" (path: ${parentPath}).`);
        treeMap[parentPath].children = treeMap[parentPath].children || [];
        treeMap[parentPath].children?.push(node);
    } else {
        // This 'else' block should now ideally only catch truly orphaned items (if content structure is broken),
        // or the `basePrefix` item itself if it was not handled by the `fullPath !== basePrefix` check.
        // For the `basePrefix` item (e.g., `/docs`), it should be in `treeMap` but NOT pushed to `rootNodes`.
        if (fullPath !== basePrefix) { 
            console.warn(`[buildNavTree] Unhandled item in tree assembly: ${fullPath}. Parent path: ${parentPath}. This should be rare with "every dir has index.md".`);
        } else {
            console.log(`[Second Pass]   --> Skipping basePrefix item "${fullPath}" from rootNodes as intended.`);
        }
    }
  });
  console.log('--- buildNavigationTree: Second Pass Completed. Final rootNodes before sort:', JSON.stringify(rootNodes, null, 2));


  // --- Final Sorting ---
  const sortTree = (nodes: NavigationLink[]) => {
    nodes.sort((a, b) => {
      const isADir = a.children && a.children.length > 0;
      const isBDir = b.children && b.children.length > 0;

      if (isADir && !isBDir) return -1; // Directories before files
      if (!isADir && isBDir) return 1; // Files after directories

      return a.label.localeCompare(b.label); // Alphabetical sort
    });
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortTree(node.children);
      }
    });
  };

  // Sort the final set of root nodes
  sortTree(rootNodes);
  console.log('--- buildNavigationTree: Final rootNodes after sort:', JSON.stringify(rootNodes, null, 2));

  // --- Redundant processNavigationTree call ---
  // The new buildNavigationTree should correctly handle index.md files by integrating them
  // into their parent directory nodes and NOT creating them as separate children.
  // Therefore, processNavigationTree should now find nothing to remove.
  // It's still called below to allow observation of its console logs.
  // After confirmation, this call and the function itself can be removed.
  return rootNodes; 
}; // buildNavigationTree()

// --- processNavigationTree (Retained for now, will likely be redundant) ---
// This function will be removed once confirmed that buildNavigationTree correctly
// prevents the creation of 'index' children.
function processNavigationTree(links: NavigationLink[]): NavigationLink[] {
  if (!links || links.length === 0) {
    return [];
  }

  return links.map(link => {
    if (link.children && link.children.length > 0) {
      console.log(`[processNavTree] Processing children of: "${link.label}" (to: ${link.to || 'none'})`); 
      const initialChildCount = link.children.length;

      const childrenToKeep: NavigationLink[] = [];
      let indexChildFoundAndPromoted = false; // Flag to ensure only one index child is promoted/handled per parent

      link.children.forEach(child => {
        const isIndexMatch = child.label.toLowerCase() === 'index' && child.to;
        if (isIndexMatch) {
            console.log(`[processNavTree]   --> Found index child (to be removed): "${child.label}" (to: "${child.to}") under parent: "${link.label}"`); 
            if (!indexChildFoundAndPromoted) {
                if (!link.to) { // Only set link.to if parent doesn't already have one
                    link.to = child.to;
                    console.log(`[processNavTree]   --> Promoted index link to parent: "${link.label}" -> "${link.to}"`); 
                } else {
                    console.log(`[processNavTree]   --> Parent "${link.label}" already has link "${link.to}". Not promoting index child's link.`); 
                }
                indexChildFoundAndPromoted = true;
            }
        } else {
            console.log(`[processNavTree]   --> Child: "${child.label}" (to: "${child.to || 'none'}"). Not an index match. Keeping.`);
            childrenToKeep.push(child); // Keep this child
        }
      });
      
      link.children = processNavigationTree(childrenToKeep); // Recurse for nested children

      if (initialChildCount !== link.children.length) {
          console.log(`[processNavTree]   --> Children count changed for "${link.label}". Old: ${initialChildCount}, New: ${link.children.length}`);
      }
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

    const rawContent = await queryCollection(collectionName).all(); 
    const content = Array.isArray(rawContent) ? rawContent : [];
    const allItems = [...content];
    
    allItems.sort((a, b) => {
      const idA = a.id || ''; 
      const idB = b.id || '';
      return idA.localeCompare(idB);
    });

    let builtTree = buildNavigationTree(allItems, props.sourcePrefix); 
    
    // Call processNavigationTree for final check and observation.
    // This call and the function itself should be removable if buildNavigationTree is perfect.
    builtTree = processNavigationTree(builtTree); 
    
    navigationLinks.value = builtTree;

  } catch (error) {
    console.error('Error fetching or building content navigation:', error);
    navigationLinks.value = [{ label: 'Error loading content navigation', collapsible: false }];
  }
};

watch(() => props.sourcePrefix, fetchAndBuildNavigation, { immediate: true });
onMounted(() => {
  fetchAndBuildNavigation();
});
</script>