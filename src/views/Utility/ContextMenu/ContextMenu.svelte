<!-- ContextMenu.svelte -->
<script>
  import { contextMenu } from "../../../scripts/storage";
  import ContentAreaContext from "./ContentAreaContext.svelte";
  import AppWindowContext from "./AppWindowContext.svelte";
  import FrameContext from "./FrameContext.svelte";
  import { afterUpdate } from "svelte";
  import ImageAppContextMenu from "./ImageAppContextMenu.svelte";

  let contextComponent;// = loadContext($contextMenu.originalTargetID)

  afterUpdate(()=>{
    contextComponent = loadContext($contextMenu.originalTargetID)
  })

  function loadContext(originalTargetID){
    console.log(originalTargetID.split('-')[0]);
    console.log(originalTargetID);
    switch (originalTargetID.split('-')[0]) {
      case 'background':
        return ContentAreaContext
        break;
      case 'mainContent':
        return ContentAreaContext
        break;
      case 'frame':
        return FrameContext
        break;
      case 'imageReferenceApp':
        return ImageAppContextMenu
      default:
        return AppWindowContext;
        break;
    }
  }

  let timeoutId;
  function handleMouseLeave() {
    timeoutId = setTimeout(() => {
      $contextMenu.visible = false;
    }, 500);
  }
  function handleMouseOver() {
    clearTimeout(timeoutId);
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="context-menu"
  style="position: absolute; left: {$contextMenu.x - 10}px; top: {$contextMenu.y - 10}px;"
  on:focus
  on:blur
  on:keydown
  on:keyup
  on:keypress
  on:mouseout={handleMouseLeave}
  on:mouseover={handleMouseOver}
  on:contextmenu|preventDefault|stopPropagation={() => {}}
>
  <svelte:component this={contextComponent} />
</div>

<style>
  .context-menu {
    background-color: #fff;
    border: 1px solid #ccc;
    z-index: 1000;
    padding: 15px 0 15px 15px;
  }
</style>
