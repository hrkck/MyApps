<!-- Content.svelte -->
<script>
  import { onMount } from "svelte";
  import { initUser, user } from "../scripts/gun";
  import AppWindow from "./Apps/AppWindow.svelte";
  import Frame from "./Apps/Frame.svelte";
  import DraggableResizable from "./DraggableResizable.svelte";
  import { contentProperties, windowStores } from "../scripts/storage";
  import { getAppIDsInAFrame, getContainingRectangle } from "../scripts/utils";

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
    scaleFunc: function (store, event, x, y, scale) {},
    clickFunc: function (store, event) {
      console.log("clicked on main content, ");
      // deactivate any active app
      if ($contentProperties.isAWindowActive) {
        $contentProperties.isAWindowActive = false;
        let activeAppStore = windowStores[$contentProperties.activeWindow];
        activeAppStore.update((data) => {
          data.isActive = false;
          return data;
        });
        user.get("windows").get($contentProperties.activeWindow).put({ isActive: false });
        $contentProperties.activeWindow = "";
      }
    },
  };

  // Reset Workspace Position
  function resetWorkspacePosition() {
    let appIDs = getAppIDsInAFrame("mainContent");
    const rect = getContainingRectangle(appIDs, 0);
    if (rect.left == Infinity) {
      $contentProperties.scale = 1;
      $contentProperties.x = window.innerWidth / 2;
      $contentProperties.y = window.innerHeight / 2;
    }
    rect.width = Math.abs(rect.right - rect.left);
    rect.height = Math.abs(rect.bottom - rect.top);
    // set "view" position to middle of the minimal containing rectangle off all windows
    $contentProperties.scale = 1;
    $contentProperties.x = (window.innerWidth - rect.width) / 2;
    $contentProperties.y = (window.innerHeight - rect.height) / 2;
    // set any window non active
    $contentProperties.isAWindowActive = false;
    $contentProperties.activeWindow = "";
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

<svelte:window on:keydown={handleKeyPress} on:click={draggableFunctions.clickFunc} />

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
