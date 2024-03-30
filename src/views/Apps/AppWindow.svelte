<!-- AppWindow.svelte -->
<script>
  import { beforeUpdate, onMount } from "svelte";
  import { applications } from "../../scripts/applicationsList";
  import { contentProperties, removeWindowStore, windowStores } from "../../scripts/storage";
  import DraggableResizable from "../DraggableResizable.svelte";
  import { checkBoundaries, getAppIDsInAFrame } from "../../scripts/utils";
  import AppPreview from "./AppPreview.svelte";
  import { user } from "../../scripts/gun";

  export let uniqueID;
  let draggableComponent; // ref to draggable component
  const store = windowStores[uniqueID];
  let appComponent = applications.find((data) => data.name == $store.name).component;

  $store.contentScale = $contentProperties.scale;
  const draggableFunctions = {
    dragStartFunc: function (store, event, x, y) {
      store.update((data) => {
        data.contentScale = $contentProperties.scale;
        return data;
      });
    },
    dragMoveFunc: function (s, event, x, y) {
      if (!event.shiftKey) {
        checkBoundaries($store.isInsideFrameID);
      }
    },
    dragEndFunc: function (s, event, x, y) {
      let frameID = $store.isInsideFrameID;
      draggableComponent.isWindowInAFrame(event);
      // !IMPORTANT
      // Update object that keeps stores here
      // windowStores[uniqueID] = store;
      // if moved to another frame
      if ($store.isInsideFrameID != "") {
        checkBoundaries(frameID);
        frameID = $store.isInsideFrameID;
      }
      checkBoundaries(frameID);

      user.get("windows").get(uniqueID).put({ x: x, y: y });
    },
    resizeMoveFunc: function (s, event, x, y, width, height) {
      checkBoundaries($store.isInsideFrameID);
    },
    resizeStartFunc: function (store, event, x, y, width, height) {
      store.update((data) => {
        data.contentScale = $contentProperties.scale;
        return data;
      });
    },
    resizeEndFunc: function (store, event, x, y, width, height) {
      store.update((data) => {
        data.contentScale = $contentProperties.scale;
        return data;
      });

      user.get("windows").get(uniqueID).put({ x: x, y: y, width: width, height: height });
    },
    scaleFunc: function () {},
    clickFunc: function (store, event) {
      console.log("clicked on window, ", uniqueID);
    },
    dbclickFunc: function (store, event) {
      if (!$contentProperties.isAWindowActive && !showIcon) {
        $contentProperties.isAWindowActive = true;
        $contentProperties.activeWindow = uniqueID;
        store.update((data) => {
          data.isActive = true;
          return data;
        });
        user.get("windows").get(uniqueID).put({ isActive: true });
      }
    },
  };

  function onClose() {
    removeWindowStore(uniqueID);
  }

  let showIcon = true;
  function checkShowIcon() {
    // Set showIcon based on the scale
    showIcon =
      $store.width * $contentProperties.scale < window.innerWidth / 4 &&
      $store.height * $contentProperties.scale < window.innerHeight / 4 &&
      $store.id != 1;
    if (showIcon && $contentProperties.activeWindow == uniqueID) {
      $contentProperties.isAWindowActive = false;
      $contentProperties.activeWindow = "";
    }
  }

  beforeUpdate(() => {
    checkShowIcon();
  });
  onMount(() => {
    checkShowIcon();
    checkBoundaries($store.isInsideFrameID);
  });
</script>

<DraggableResizable {uniqueID} {store} {...draggableFunctions} bind:this={draggableComponent}>
  <div class="window-header app-header">
    <div class="app-name">
      {$store.name}
    </div>
    <input
      type="button"
      value="X"
      class="close-button"
      style="
    background-color: red;
    "
      on:click={() => {
        onClose();
      }}
      on:touchstart={onClose}
      on:keydown
      on:keyup
      on:keypress
    />
  </div>
  <div class="app-content" style="" class:pointer-events={!$store.isActive}>
    {#if showIcon}
      <AppPreview />
    {:else}
      <svelte:component this={appComponent} {uniqueID} />
    {/if}
  </div>
</DraggableResizable>

<style>
  .app-header {
    position: relative;
    width: 100%;
    height: 30px;
    background-color: #2196f3;
    display: flex;
    justify-content: space-between;
    cursor: move;
    align-items: center;
    color: #fff;
  }

  .app-name {
    margin-left: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .app-content {
    position: absolute;
    width: 100%;
    height: 100% - 30px;
    top: 30px;
    bottom: 0;
    display: block;
    /* align-items: center;
    justify-content: space-around; */
    overflow: hidden;
    background-color: rgb(255, 255, 255);
  }

  .pointer-events {
    pointer-events: none;
    user-select: none;
  }

  .close-button {
    border-radius: 5px;
    background-color: red;
    color: white;
    font-weight: bold;
    cursor: pointer;
    margin-right: 10px;
  }
</style>
