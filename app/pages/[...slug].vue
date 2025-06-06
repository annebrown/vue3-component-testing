<!--------@/pages/[...slug].vue------------------------------------------------>
<template>
  <!-- No div - breaks route-->

    <div>
        <ContentRenderer v-if="page" :value="page" />
        <div v-else>Loading...</div>
    </div>
 
</template>

<script lang="ts" setup>
    const route = useRoute()
    const { data: page } = await useAsyncData(route.path, () => { return queryCollection('docs').path(route.path).first() })
</script>
<!--------@/pages/[...slug].vue------------------------------------------------>