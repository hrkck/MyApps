<!--  Workscape.svelte -->
<script>
  import AppWindow from "./AppWindow.svelte";
  import {
    workspaceStore,
    windowsStore,
    windowPropertyStores,
  } from "../../store.js";
  import { onMount, onDestroy } from "svelte";
  import { closeWindow, updateWindowStore } from "../../js/utils";
  import DragSelect from "./DragSelect.svelte";

  
  // #################################################### //
  // dragging functionality
  let isDraggingWorkspace = false;

  function handleMouseDown(event) {
    if ($workspaceStore.isAWindowActivated) return;
    if (event.button === 0 && !event.shiftKey) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
  }

  function handleMouseMove(event) {
    isDraggingWorkspace = true;
    const deltaX = event.movementX;
    const deltaY = event.movementY;
    $workspaceStore.contentX += deltaX;
    $workspaceStore.contentY += deltaY;
    $workspaceStore.backgroundX += deltaX;
    $workspaceStore.backgroundY += deltaY;
  }

  function handleMouseUp() {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    if (!isDraggingWorkspace) {
      $workspaceStore.selectedWindows = []; // Reset selectedWindows for empty area click
    }
  }

  // #################################################### //
  // zoom functionality
  // https://stackoverflow.com/a/3151987
  const scaleStep = 0.1; // Adjust the scaling step for smoother zoom
  $: backgroundOpacity = Math.min(1, $workspaceStore.backgroundScale);

  function handleWheel(event) {
    if ($workspaceStore.isAWindowActivated) return;
    event.preventDefault();

    // Get mouse offset relative to the event's current target
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top - 10;

    console.log(mouseX, mouseY);


    // Normalize mouse wheel to +1 or -1
    const wheel = event.deltaY < 0 ? 1 : -1;

    // Compute zoom factor
    const zoom = Math.exp(wheel * scaleStep);

    // Compute the new scale
    let newScale = $workspaceStore.scale * zoom;
    let newBackgroundScale = $workspaceStore.backgroundScale * zoom;

    // Ensure the scale doesn't get too small or too large
    if (newScale > 0.05 && newScale < 7) {
      // Adjust contentX and contentY to keep the mouse point constant
      // The formula here is a bit different from Stack overflow answer!
      // We first take the delta of content to the mouse position multiplied by the ratio of scales,
      // then add the mouse position to the content. This value is then assigned to the new value of the content (for X and Y)
      $workspaceStore.contentX =
        ($workspaceStore.contentX - mouseX) *
          (newScale / $workspaceStore.scale) +
        mouseX;
      $workspaceStore.contentY =
        ($workspaceStore.contentY - mouseY) *
          (newScale / $workspaceStore.scale) +
        mouseY;
      $workspaceStore.backgroundX = $workspaceStore.contentX;
      $workspaceStore.backgroundY = $workspaceStore.contentY;

      // Apply the new scale
      $workspaceStore.scale = newScale;
      $workspaceStore.backgroundScale = newBackgroundScale;
    }
  }

  // #################################################### //
  // Reset Workspace Position
  function resetWorkspacePosition() {
    $workspaceStore.contentX =
      window.innerWidth / 2 - $workspaceStore.contentWidth / 2;
    $workspaceStore.contentY =
      window.innerHeight / 2 - $workspaceStore.contentHeight / 2;
    $workspaceStore.scale = 1;
    $workspaceStore.backgroundScale = 1;
  }

  // #################################################### //
  // Handle Click Event for Empty Area in Workspace
  function handleWorkspaceClick() {
    if (isDraggingWorkspace) {
      isDraggingWorkspace = false;
      return;
    }
    if ($workspaceStore.isAWindowActivated) {
      $workspaceStore.isAWindowActivated = false;
      windowPropertyStores.forEach((store) => {
        if (get(store).isActiveApp == true) {
          updateWindowStore(get(store).windowId, (props) => {
            props.isActiveApp = false;
            return props;
          });
        }
      });
    }
  }

  function handleKeyPress(event) {
    if (event.key === "Home" || event.code === "Home") {
      resetWorkspacePosition();
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeyPress);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleKeyPress);
  });

  // #################################################### //
  // touch events
  let touchStartX = 0;
  let touchStartY = 0;

  function handleTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }
  }

  function handleTouchMove(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
      isDraggingWorkspace = true;
      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      $workspaceStore.contentX += deltaX;
      $workspaceStore.contentY += deltaY;
      $workspaceStore.backgroundX += deltaX;
      $workspaceStore.backgroundY += deltaY;
    }
  }

  // Context Menu
  import ContextMenu from "./ContextMenu.svelte";
  import { get } from "svelte/store";

  let contextMenuVisible = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let screenContextX = 0;
  let screenContextY = 0;

  function showContextMenu(event) {
    if($workspaceStore.isAWindowActivated) return;
    event.preventDefault();
    contextMenuX = event.clientX;
    contextMenuY = event.clientY;
    // set screenContextX and Y values
    // to load apps under the cursor
    screenContextX =
      (event.clientX - $workspaceStore.contentX) / $workspaceStore.scale;
    screenContextY =
      (event.clientY - $workspaceStore.contentY) / $workspaceStore.scale;
    contextMenuVisible = true;
  }

  function hideContextMenu() {
    contextMenuVisible = false;
  }
</script>

<div
  id="workspace"
  class={$workspaceStore.isAWindowMaximized ? "allow_maximized_window" : ""}
  on:wheel={handleWheel}
  on:mousedown={handleMouseDown}
  on:touchstart={handleTouchStart}
  on:touchmove={handleTouchMove}
  on:click={handleWorkspaceClick}
  on:keydown
  on:keyup
  on:keypress
  on:click={hideContextMenu}
  on:contextmenu={showContextMenu}
  style="
  background-image: radial-gradient(rgba(0,0,0,{backgroundOpacity}) 1px, transparent 0);
  background-position: {$workspaceStore.backgroundX}px {$workspaceStore.backgroundY}px; 
  background-size: {80 * $workspaceStore.backgroundScale}px {80 *
    $workspaceStore.backgroundScale}px;
  "
>
  <div
    id="content"
    style="
    transform: scale({$workspaceStore.scale});  
    left: {$workspaceStore.contentX}px; 
    top: {$workspaceStore.contentY}px;
    width: {$workspaceStore.contentWidth}px;
    height: {$workspaceStore.contentHeight}px; 
    "
  >
    {#each $windowsStore as window (window.windowId)}
      <!-- {#if window.isInsideFrameId == 0} -->
      <AppWindow
        now={window.windowId}
        scale={$workspaceStore.scale}
        onClose={(e) => closeWindow(window.windowId)}
        selected={$workspaceStore.selectedWindows.includes(window.windowId)}
      />
      <!-- {/if} -->
    {/each}
  </div>
</div>

<DragSelect />

{#if contextMenuVisible}
  <ContextMenu
    {contextMenuX}
    {contextMenuY}
    {screenContextX}
    {screenContextY}
    {hideContextMenu}
  />
{/if}

<style>
  #workspace {
    position: relative;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    padding: 0;
    margin: 0;
    background: rgb(255, 255, 255);
    background-image: radial-gradient(black 1px, transparent 0);
    transition: transform 0.3s ease;
    overflow: hidden;
  }

  #content {
    position: absolute;
    transform-origin: 0 0;
    width: 98%;
    height: 98%;
    outline: 50px dashed black;
  }

  .allow_maximized_window {
    transform: translateX(-100vw);
  }
</style>
