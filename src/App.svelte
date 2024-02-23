<!-- App.svelte -->
<script>
  import { onMount } from "svelte";
  import { workspaceStore } from "./store";
  import Menu from "./views/Workspace/Menu.svelte";
  import Workspace from "./views/Workspace/Workspace.svelte";


  onMount(async () => {
    // Call the function to initialize user session
    // await initializeUserSession();
    
  });
</script>

<main>
  {#if !$workspaceStore.isAWindowActivated}
    <Menu />
  {/if}
  <Workspace />
</main>

<style>
  main {
    text-align: center;
    /* max-width: 240px; */
    margin: 0 auto;
  }

  /* @media (min-width: 640px) {
    main {
      max-width: none;
    }
  } */
</style>
