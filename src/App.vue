<template>
  <div>
    <h1>amass</h1>
    <main-content></main-content>
    <h-foot></h-foot>
  </div>
</template>

<script>
import MainContent from './components/mainContent.vue';
import HFoot from './components/hFoot.vue';

export default {
  name: 'App',
  components: {
    MainContent, HFoot
  }
}
</script>