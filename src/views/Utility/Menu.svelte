<!-- Menu.svelte -->
<script>
  import { writable } from "svelte/store";
  import { contentProperties } from "../../scripts/storage";
  // import SearchApplication from './SearchApplication.svelte';
  // import SelectApplication from './SelectApplication.svelte';
  import Settings from "./Settings.svelte";
  let isSettingsOpen = writable($contentProperties.isAWindowActive == "settings");
  // export let applications;
</script>

<div id="header">
  <!-- <SelectApplication {applications}/> -->
  <!-- <SearchApplication {applications}/> -->
  <Settings {isSettingsOpen}/>
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
