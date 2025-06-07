<template>
    <div class="p-4">

        <p><b>Vue 3 Component Testing App</b></p>
        <p>Testing the @annebrown.ca/vue3-fleet-pub module. ...</p>
        <br/>

        <p><b>StarterTest: </b></p><br/>
        <StarterTest /><br/>

        <p><b>NaviSourceNaviTree: Docs</b></p><br/>
        <NaviSourceNaviTree 
            sourcePrefix="/docs"
            :initialExpansionLevel="0"
        />


        <p><b>NaviSourceNaviTree: Second Source</b></p><br/>
        <NaviSourceNaviTree 
            sourcePrefix="/otherdocs"
            :initialExpansionLevel="999"
        />

        </div>
</template>
<script setup lang="ts">
import { StarterTest } from '@annebrown.ca/vue3-fleet-pub'; 
</script>
