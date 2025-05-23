<!-- Content.svelte -->
<script>
  import { onMount } from "svelte";
  import { initUser, user } from "../scripts/initGun";
  import AppWindow from "./Apps/AppWindow.svelte";
  import Frame from "./Apps/Frame.svelte";
  import DraggableResizable from "./DraggableResizableScalableComponent/DraggableResizableScalable.svelte";
  import { contentProperties, contextMenu } from "../scripts/storage";
  import { deactivateWindow, getAppIDsInAFrame, getContainingRectangle } from "../scripts/utils";
    import ZoomIndicator from "./Utility/ZoomIndicator.svelte";

  let zoomIndicatorRef;

  const draggableFunctions = {
    dragStartFunc: function (store, event, x, y) {
      $contentProperties.contentScale = 1;
    },
    dragMoveFunc: function (store, event, x, y) {},
    dragEndFunc: function (store, event, x, y) {},
    resizeStartFunc: function (store, event, x, y, width, height) {
      $contentProperties.contentScale = 1;
    },
    resizeEndFunc: function (store, event, x, y, width, height) {},
    resizeMoveFunc: function (store, event, x, y, width, height) {},
    scaleFunc: function (store, event, x, y, scale) {
      store.update((store) => {
        if (scale > 0.05 && scale < 7) {
          store.x =
            (store.x - x / store.contentScale) * (scale / store.scale) + x / store.contentScale;
          store.y =
            (store.y - y / store.contentScale) * (scale / store.scale) + y / store.contentScale;
          store.scale = scale;
        }
        if (store.scale == undefined) {
          store.scale = 1;
        }

        // Compute visible size
        const visibleWidth = window.innerWidth / store.scale;
        const visibleHeight = window.innerHeight / store.scale;

        // Show zoom indicator
        zoomIndicatorRef?.show(visibleWidth, visibleHeight);
        return store;
      });
    },
    clickFunc: function (store, event) {
      // deactivate any active app
      if ($contentProperties.isAWindowActive == "settings") {
        return;
      } else if ($contentProperties.isAWindowActive) {
        deactivateWindow($contentProperties.activeWindow);
      }

      if ($contextMenu.visible) {
        $contextMenu.visible = false;
      }
    },
  };

  // Reset Workspace Position
  // Reset Workspace Position
  // Reset Workspace Position
  function resetWorkspacePosition() {
    let appIDs = getAppIDsInAFrame("mainContent");
    const rect = getContainingRectangle(appIDs, 50); // Assuming padding is 50

    if (rect.left === Infinity || rect.top === Infinity) {
      $contentProperties.scale = 1;
      $contentProperties.x = window.innerWidth / 2;
      $contentProperties.y = window.innerHeight / 2;
      return;
    }

    rect.width = rect.right - rect.left;
    rect.height = rect.bottom - rect.top;

    // Calculate the scale factor to fit the entire rectangle in the view
    const scaleX = window.innerWidth / rect.width;
    const scaleY = window.innerHeight / rect.height;
    const scale = Math.min(scaleX, scaleY);

    // Calculate the center of the containing rectangle
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate the new content position to center the view on the containing rectangle
    $contentProperties.scale = scale;
    $contentProperties.x = window.innerWidth / 2 - centerX * scale;
    $contentProperties.y = window.innerHeight / 2 - centerY * scale;

    // Deactivate any active window
    deactivateWindow($contentProperties.activeWindow);
  }

  function handleKeyPress(event) {
    if (event.key === "Home" || event.code === "Home") {
      console.log("home presses");
      resetWorkspacePosition();
    }
  }

  // Helper function to determine if an ID belongs to a frame
  function isFrame(id) {
    return id.startsWith("frame-");
  }

  onMount(() => {
    initUser();
  });
</script>

<svelte:window onkeydown={handleKeyPress} onclick={draggableFunctions.clickFunc} />

<ZoomIndicator bind:this={zoomIndicatorRef} mainContent={true} />

<DraggableResizable
  uniqueID={$contentProperties.uniqueID}
  store={contentProperties}
  {...draggableFunctions}
>
  <div id="content">
    {#each Object.keys($contentProperties.windowList) as id (id)}
      {#if isFrame(id)}
        <Frame uniqueID={id} />
      {:else}
        <AppWindow uniqueID={id} />
      {/if}
    {/each}
  </div>
</DraggableResizable>

<style>
  #content {
    position: absolute;
    backface-visibility: hidden;
    /* background-color: #7fffd43b; */
    /* height: ; */
    /* width: fit-content !important; */
  }
</style>
