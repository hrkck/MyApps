<!-- // App.svelte -->
<script>
  import Background from "./views/Background.svelte";
  import Content from "./views/Content.svelte";
  import ContextMenu from "./views/Utility/ContextMenu.svelte";
  import Menu from "./views/Utility/Menu.svelte";
  import {
    contentProperties,
    contextMenuVisible,
  } from "./scripts/storage";

  // Context Menu management
  // let contextMenuVisible = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let screenContextX = 0;
  let screenContextY = 0;

  function showContextMenu(event) {
    // if ($workspaceStore.isAWindowActivated) return;
    event.preventDefault();
    contextMenuX = event.clientX;
    contextMenuY = event.clientY;
    // set screenContextX and Y values
    // to load apps under the cursor
    screenContextX =
      (event.clientX - $contentProperties.x) / $contentProperties.scale;
    screenContextY =
      (event.clientY - $contentProperties.y) / $contentProperties.scale;
    $contextMenuVisible = true;
  }

</script>

<svelte:window on:contextmenu={showContextMenu} />

<main id="app">
    <Content />
    <Background store={contentProperties} />

    <!-- right click context menu for adding apps, app groups, reset storage etc. -->
    {#if $contextMenuVisible}
      <ContextMenu
        {contextMenuX}
        {contextMenuY}
        {screenContextX}
        {screenContextY}
      />
    {/if}
    <!-- Add settings button  -->
    <Menu />
    <!-- Add hovering tutorial overlays -->
</main>

<style>
  #app {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    padding: 0;
    margin: 0;
  }
</style>
