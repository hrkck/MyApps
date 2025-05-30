<!-- Content.svelte -->
<script>
  import { onMount } from "svelte";
  import { initGunDB} from "../scripts/initGun";
  import AppWindow from "./Apps/AppWindow.svelte";
  import Frame from "./Apps/Frame.svelte";
  import DraggableResizable from "./DraggableResizableScalableComponent/DraggableResizableScalable.svelte";
  import { contentProperties, contextMenu, windowStores } from "../scripts/storage";
  import { deactivateWindow, frameApps, getAppIDsInAFrame, getContainingRectangleOfApps } from "../scripts/utils";
  import ZoomIndicator from "./Utility/ZoomIndicator.svelte";
    import { get } from "svelte/store";

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
        deactivateWindow();
      }

      if ($contextMenu.visible) {
        $contextMenu.visible = false;
      }
    },
  };

  // Reset Workspace Position
  function resetWorkspacePosition() {
    frameApps(Object.keys($windowStores).filter((id) => id !== "mainContent"));
    // Deactivate any active window
    deactivateWindow();
  }

  function handleKeyPress(event) {
    if ($contentProperties.isAWindowActive) {
       if (event.key === "Escape") {
        console.log("ESC presses");
        deactivateWindow();
      }
    }else {
      if (event.key === "Home" || event.code === "Home") {
        console.log("home presses");
        resetWorkspacePosition();
      } 
      else if (event.key === "f" || event.code === "KeyF") {
        console.log("F presses");
        resetWorkspacePosition();
      } 
    }
  }

  // Helper function to determine if an ID belongs to a frame
  function isFrame(id) {
    return id.startsWith("frame-");
  }

  onMount(async () => {
    // await initUser();
    await initGunDB();
  });
  let storeMap = $derived($windowStores);
  let windowKeys = $derived(Object.keys($contentProperties.windowList));
</script>

<svelte:window onkeydown={handleKeyPress} onclick={draggableFunctions.clickFunc} />

<ZoomIndicator bind:this={zoomIndicatorRef} mainContent={true} />

<DraggableResizable
  uniqueID={$contentProperties.uniqueID}
  store={contentProperties}
  {...draggableFunctions}
>
  <div id="content">
    {#if windowKeys.length === 0}
      <p></p>
    {:else}
      {#each windowKeys as uniqueID (uniqueID)}
        {#if isFrame(uniqueID)}
          <Frame {uniqueID} />
        {:else}
          <AppWindow {uniqueID} />
        {/if}
      {/each}
    {/if}
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
