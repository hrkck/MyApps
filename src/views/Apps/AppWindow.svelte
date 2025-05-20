<!-- @migration-task Error while migrating Svelte code: Can't migrate code with beforeUpdate. Please migrate by hand. -->
<!-- AppWindow.svelte -->
<script>
  import { beforeUpdate, onMount } from "svelte";
  import { applications } from "../../scripts/applicationsList";
  import { contentProperties, removeWindowStore, windowStores } from "../../scripts/storage";
  import DraggableResizable from "../DraggableResizableScalableComponent/DraggableResizableScalable.svelte";
  import { activateWindow, checkBoundaries, getAppIDsInAFrame } from "../../scripts/utils";
  import AppPreview from "./AppPreview.svelte";
  import { user } from "../../scripts/initGun";

  export let uniqueID;
  let draggableComponent; // ref to draggable component
  const store = $windowStores[uniqueID];
  console.log(store);
  let appComponent = null; // Will hold the dynamically loaded component
  let isLoading = false; // Flag to indicate if the component is loading
  let loadError = null; // To capture any loading errors

  console.log(uniqueID);
  // console.log(typeof uniqueID);
  // console.log($store);
  const isLinkApp = uniqueID.split("-")[0] == "linkApp";

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
      // console.log("clicked on window, ", uniqueID);
    },
    dbclickFunc: function (store, event) {
      if (!$contentProperties.isAWindowActive && !showIcon) {
        activateWindow(uniqueID);
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

  // Function to dynamically load the component
  async function loadAppComponent() {
    if (appComponent || isLoading) return;
    isLoading = true;
    loadError = null;
    try {
      // Find the application data
      const appData = applications.find(
        (data) => data.name === $store.name
      );
      if (appData && typeof appData.component === "function") {
        const module = await appData.component();
        appComponent = module.default;
      } else if (appData && appData.component) {
        // Fallback if component is already imported
        appComponent = appData.component;
      } else {
        throw new Error(`Component not found for application ${$store.name}.`);
      }
    } catch (error) {
      console.error("Failed to load component:", error);
      loadError = error;
    } finally {
      isLoading = false;
    }
  }


  beforeUpdate(() => {
    checkShowIcon();
    if (!showIcon && !appComponent && !isLoading) {
      loadAppComponent();
    }
  });
  onMount(() => {
    checkShowIcon();
    checkBoundaries($store.isInsideFrameID);

    // user.get("windows").get(uniqueID).get('x').on(data=>{
    //   // console.log(data);
    //   $store.x=data
    // })
    // user.get("windows").get(uniqueID).get('y').on(data=>{
    //   // console.log(data);
    //   $store.y=data
    // })
  });
</script>

<DraggableResizable {uniqueID} {store} {...draggableFunctions} bind:this={draggableComponent}>
  <div id={uniqueID + "-appcontent"} class="app-content" class:pointer-events={!$store.isActive && !isLinkApp}>
    {#if showIcon}
      <AppPreview {uniqueID} />
    {:else if appComponent}
      <svelte:component this={appComponent} {uniqueID} />
    {:else if isLoading}
      <p>Loading...</p>
    {:else if loadError}
      <p>Error loading component.</p>
    {/if}
  </div>
</DraggableResizable>

<style>
  .app-content {
    position: absolute;
    width: 100%;
    height: 100%; /* - 30px;*/
    bottom: 0;
    display: block;
    overflow: hidden;
    background-color: rgb(255, 255, 255);
    border: 1px solid black;
  }
  .pointer-events {
    pointer-events: none;
    user-select: none;
  }
</style>
