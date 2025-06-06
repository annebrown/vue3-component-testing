<!-------- @/app.vue -------->
 <script setup lang="ts">
  import { ref, watch } from 'vue'; 

  const route = useRoute(); 

  const expandedFolders = ref(new Set<string>());

const toggleFolder = (path: string) => {
  if (expandedFolders.value.has(path)) {
    expandedFolders.value.delete(path);
  } else {
    expandedFolders.value.add(path);
  }
};

const isCurrentPage = (path: string) => {
  // SAFELY check route.path. If route or route.path is undefined (e.g., during SSR), return false.
  // This prevents the "Cannot read properties of undefined (reading 'path')" error.
  return route.path !== undefined && route.path === path;
};

const isCurrentFolder = (path: string) => {
  // SAFELY check route.path
  return route.path !== undefined && route.path.startsWith(path + '/');
};

const folderMetaMap = ref({}); // Populated internally by SourceNaviTree 

// Optional: You can watch for route changes to automatically expand folders
// This is more advanced but good for real-world usage.
// watch(() => route.path, (newPath) => {
//   // Example: if /docs/introduction is visited, expand /docs
//   const segments = newPath.split('/').filter(Boolean);
//   if (segments.length > 0) {
//     let currentPath = '';
//     segments.forEach(segment => {
//       currentPath += '/' + segment;
//       expandedFolders.value.add(currentPath);
//     });
//   }
// }, { immediate: true }); // Run immediately on component load

</script>

<template>
  <div>
    <NuxtLayout>
      <header>
        <h1 class="text-3xl font-bold p-4">vue3-component-testing</h1>
      </header>
      <div class="flex">
        <!-- <aside class="w-64 p-4 border-r">
          <SourceNaviTree
            source-prefix="docs"
            :expanded-folders="expandedFolders"
            :toggle-folder="toggleFolder"
            :is-current-page="isCurrentPage"
            :is-current-folder="isCurrentFolder"
            :folder-meta-map="folderMetaMap"
            class="bg-gray-500 p-2 rounded text-black"
          />
        </aside> -->
        <main class="flex-1 p-4">

            <h2 class="text-xl font-semibold mb-4">Reference App - Nuxt3 Content3 Module</h2>
            <h3>
                Reference and Test App for Vue 3 Modules
            </h3>

            <h2 class="text-xl font-semibold mb-4">Page Content Below</h2>
            <NuxtPage />

        </main>
      </div>
    </NuxtLayout>
  </div>
</template>