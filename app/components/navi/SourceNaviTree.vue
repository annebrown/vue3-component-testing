<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
// Correct import for NaviTree from the package itself
import { NaviTree } from '@annebrown.ca/vue3-fleet-pub'; 

interface NavigationLink {
  label: string;
  to?: string;
  children?: NavigationLink[];
  collapsible?: boolean;
}

const props = defineProps<{
  sourcePrefix?: string;
  initialExpansionLevel?: number;
}>();

const navigationLinks = ref<NavigationLink[]>([]);

// --- START: buildNavigationTree function (defined directly here) ---
const buildNavigationTree = (items: any[], basePrefix: string): NavigationLink[] => {
  const tree: NavigationLink[] = [];
  const pathToNodeMap = new Map<string, NavigationLink>();

  const normalizedBasePrefix = basePrefix.endsWith('/') ? basePrefix.slice(0, -1) : basePrefix;

  const getOrCreateNode = (path: string, defaultLabel: string, isCollapsible: boolean, isDirectory: boolean): NavigationLink => {
      if (!pathToNodeMap.has(path)) {
          const newNode: NavigationLink = {
              label: defaultLabel,
              to: path,
              children: [],
              collapsible: isCollapsible
          };
          pathToNodeMap.set(path, newNode);
      }
      return pathToNodeMap.get(path)!;
  };

  items.forEach(item => {
    // Using item.path instead of item._path
    if (!item.path || !item.path.startsWith(normalizedBasePrefix)) {
        return;
    }

    const itemPath = item.path;
    const itemDir = item.dir; // Using item.dir
    const itemTitle = item.title || item.label || (item.file ? item.file.split('.')[0] : itemDir.split('/').pop()) || 'Untitled'; // Using item.file
    const isDirectoryIndex = item.file === 'index.md'; // Using item.file

    if (isDirectoryIndex) {
      const dirNode = getOrCreateNode(itemDir, itemTitle, true, true);
      dirNode.to = itemPath;
    } else {
      const fileNode = getOrCreateNode(itemPath, itemTitle, false, false);
      fileNode.collapsible = false;
    }
  });

  pathToNodeMap.forEach(node => {
      const parentPath = node.to ? node.to.substring(0, node.to.lastIndexOf('/')) : null;

      if (parentPath && pathToNodeMap.has(parentPath)) {
          const parentNode = pathToNodeMap.get(parentPath)!;

          if (!parentNode.children) {
              parentNode.children = [];
          }

          if (!parentNode.children.some(child => child.to === node.to)) {
              parentNode.children.push(node);
          }
          parentNode.collapsible = true;
      } else {
          if (node.to && node.to.startsWith(normalizedBasePrefix) && !tree.some(root => root.to === node.to)) {
              const isDirectChildOfBase = parentPath === normalizedBasePrefix;
              if (isDirectChildOfBase || node.to === normalizedBasePrefix) {
                tree.push(node);
              }
          }
      }
  });

  const finalTree = tree.filter(rootNode => {
      const parentPath = rootNode.to ? rootNode.to.substring(0, rootNode.to.lastIndexOf('/')) : null;
      return rootNode.to === normalizedBasePrefix || !parentPath || !pathToNodeMap.has(parentPath);
  });

  const sortNodes = (nodes: NavigationLink[]) => {
    nodes.sort((a, b) => {
      const isADir = a.children && a.children.length > 0;
      const isBDir = b.children && b.children.length > 0;
      if (isADir && !isBDir) return -1;
      if (!isADir && isBDir) return 1;
      return (a.label || '').localeCompare(b.label || '');
    });
    nodes.forEach(node => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };
  sortNodes(finalTree);

  return finalTree;
};
// --- END: buildNavigationTree function ---


// Your provided function to fetch and build navigation
const fetchAndBuildNavigation = async () => {
  if (!props.sourcePrefix) {
    console.warn('SourcePrefix is required for SourceNaviTree.');
    navigationLinks.value = [];
    return;
  }

  try {
    const collectionName = props.sourcePrefix.replace(/^\//, '');

    // queryCollection is assumed to be global
    const rawContent = await queryCollection(collectionName).all();
    const content = Array.isArray(rawContent) ? rawContent : [];
    const allItems = [...content];

    allItems.sort((a: any, b: any) => {
      const idA = a.id || '';
      const idB = b.id || '';
      return idA.localeCompare(idB);
    });

    let builtTree = buildNavigationTree(allItems, props.sourcePrefix);

    // REMOVED: builtTree = processNavigationTree(builtTree); // This line is removed

    navigationLinks.value = builtTree;

  } catch (error) {
    console.error('Error fetching or building content navigation:', error);
    navigationLinks.value = [{ label: 'Error loading content navigation', collapsible: false }];
  }
};

onMounted(fetchAndBuildNavigation);
watch(() => props.sourcePrefix, fetchAndBuildNavigation);

</script>

<template>
  <div class="px-2">
    <nav>
      <NaviTree
        :links="navigationLinks"
        ulClasses="ml-4 list-none p-0 text-green-500"
        liClasses="m-0 p-0 text-green-600"
        ulChildrenClasses="ml-4 list-none p-0 text-green-500"
        :depth="0"
        :initialExpansionLevel="props.initialExpansionLevel"
      />
    </nav>
  </div>
</template>

<style scoped>
/* Add any SourceNaviTree specific styles here if needed */
</style>