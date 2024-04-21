<!-- Background.svelte -->
<script>
  export let store;
</script>

<div
  id={$store.uniqueID + "-background"}
  class="background"
  style="
  background-position: {$store.x}px {$store.y}px; 
  background-size: {100 * $store.scale}px {100 * $store.scale}px;
  background-color: {$store.backgroundColor};
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
    /* background: rgb(248, 255, 243); */
    background-image: radial-gradient(black 1px, transparent 0);
    overflow: hidden;
  }
</style>
