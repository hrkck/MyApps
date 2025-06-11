<!-- Background.svelte -->
<script>
  let { store } = $props();
</script>

<div
  id={$store.uniqueID + "-background"}
  class="background"
  style="
  background-position: {$store.x}px {$store.y}px; 
  background-color: {$store.backgroundColor}; 
  background-size: {100 * $store.scale}px {100 * $store.scale}px;
  
  "
></div>
<style>
  .background {
    position: absolute;
    backface-visibility: hidden;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    z-index: 1;
    /* background: rgb(235, 232, 247); */
    background-image: radial-gradient(black 1px, transparent 0);
    overflow: hidden;
  }
</style>
