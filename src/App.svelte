<!-- // App.svelte -->
<script>
  import Background from "./views/Background.svelte";
  import Content from "./views/Content.svelte";
  import ContextMenu from "./views/Utility/ContextMenu/ContextMenu.svelte";
  import Menu from "./views/Utility/Menu.svelte";
  import { contentProperties, contextMenu } from "./scripts/storage";
  import DragSelect from "./views/Utility/DragSelect.svelte";

  // Context Menu management

  function showContextMenu(event) {
    event.preventDefault();
    if ($contentProperties.isAWindowActive) return;
    $contextMenu.x = event.clientX;
    $contextMenu.y = event.clientY;
    // set screenContextX and Y values
    // to load apps under the cursor
    $contextMenu.screenX = (event.clientX - $contentProperties.x) / $contentProperties.scale;
    $contextMenu.screenY = (event.clientY - $contentProperties.y) / $contentProperties.scale;
    $contextMenu.visible = true;
    $contextMenu.originalTargetID = event.srcElement.id || event.originalTarget.id;
  }

  function trackMousePosition(event) {
    $contentProperties.mouseX = event.clientX;
    $contentProperties.mouseY = event.clientY;
  }
</script>

<svelte:window
  oncontextmenu={showContextMenu}
  onmousemove={trackMousePosition}
  ondragover={trackMousePosition}
/>

<main id="app">
  <Content />
  <Background store={contentProperties} />

  <!-- Add App Selection -->
  <DragSelect></DragSelect>

  <!-- right click context menu for adding apps, app groups, reset storage etc. -->
  {#if $contextMenu.visible}
    <ContextMenu />
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
    overflow: hidden;
  }
</style>
