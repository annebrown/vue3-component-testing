<template><div>

    <!-- Page -->
    <div class="content-background">
       
        <div class="mx-4">
            
            <div v-if="page">
                <!-- Title -->
                <h1 class="pt-6 pb-2 text-left text-4xl 
                    font-extrabold text-[--ui-secondary]">
                    <slot name="title">
                        {{ page.title }}
                    </slot>
                </h1>

                <!-- Description -->
                <p class="mb-0 pb-1 text-xs text-left">
                    {{ page.description }}
                </p>

                <!-- Last Modification -->
                <!-- <p class="text-xs m-0 p-0 pb-2">
                    {{ page.lastModified }}
                </p> -->
            </div>

        <hr class="mt-0 pt-0 px-8 border-solid" />

        <!-- Remaining Cargo -->
        <main class="w-full prose dark:prose-invert my-6">

            <ContentRenderer v-if="page" :value="page" />
            <div v-else>
                Loading...
            </div>

        </main>

      
    </div> <!-- Page -->

</div></template>

<script setup lang="ts">
    const route = useRoute();
    const { data: page } = await useAsyncData(route.path, () => { return queryCollection('docs').path(route.path).first()
})

</script>