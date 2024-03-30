<!-- Menu.svelte -->
<script>
  // import SearchApplication from './SearchApplication.svelte';
  // import SelectApplication from './SelectApplication.svelte';
  import Settings from "./Settings.svelte";

  // export let applications;
</script>

<div id="header">
  <!-- <SelectApplication {applications}/> -->
  <!-- <SearchApplication {applications}/> -->
  <Settings />
</div>

<style>
  #header {
    position: absolute;
    top: 1%;
    right: 5%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    z-index: 999999;
  }
</style>
