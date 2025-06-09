<template>
    <div class="p-4">

        <p><b>Vue 3 Component Testing App</b></p>
        <p>Testing the @annebrown.ca/vue3-fleet-pub module. ...</p>
        <br/>

        <p><b>NaviSourceNaviTree: Docs</b></p><br/>
        <SourceNaviTree 
            sourcePrefix="/docs"
            :initialExpansionLevel="0"
        />

        <p><b>NaviSourceNaviTree: Second Source</b></p><br/>
        <SourceNaviTree 
            sourcePrefix="/otherdocs"
            :initialExpansionLevel="999"
        />

        <p><b>NaviPagesNaviTree: All Pages</b></p><br/>
        <PagesNaviTree
            baseRoutePrefix="/"
            :initialExpansionLevel="1"
        />

        <p><b>NaviPagesNaviTree: Admin Section</b></p><br/>
        <PagesNaviTree
            baseRoutePrefix="/admin"
            :initialExpansionLevel="999"
        />

        </div>
</template>
<script setup lang="ts">
import { SourceNaviTree, PagesNaviTree } from '@annebrown.ca/vue3-fleet-pub'; 
    const pageTitle = 'Vue3 Component Testing'
    const pageDescription = 'Test App for Public, Fleet-Wide Modules'
    definePageMeta({ 
        title: pageTitle, 
        description: pageDescription,
        layout: 'pages'
    })
</script>
