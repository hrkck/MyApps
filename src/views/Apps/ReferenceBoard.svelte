<!-- ReferenceBoard.svelte -->
<script>
  import { onMount } from "svelte";
  import { initializeDB, saveImageToDB, clearDB } from "../../js/db_service.js";
  import { nowStr } from "../../js/utils.js";
  import { getLocalSvelteStore } from "../../store.js";

  export let windowId;
  export let windowIconUrl;
  export let isWindowActive;
  export let showIcon;


  let referenceAppElement;

  let db;
  let dbName = "pastedImagesDB-" + windowId;
  let storeName = "pastedImages-" + windowId;

  let images = [];

  const ReferenceBoardStore = getLocalSvelteStore(
    "referenceBoardStore-" + windowId,
    {
      images: images,
      scale: 1,
      backgroundScale: 1,
      contentX: 0,
      contentY: 0,
      contentHeight: 320,
      contentWidth: 240,
      backgroundX: 0,
      backgroundY: 0,
    }
  );

  // #################################################### //
  // dragging functionality
  let isDraggingWorkspace = false;

  function handleMouseDown(event) {
    if (!isWindowActive) return;
    if (event.button === 0 && !event.shiftKey) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
  }

  function handleMouseMove(event) {
    isDraggingWorkspace = true;
    const deltaX = event.movementX;
    const deltaY = event.movementY;
    $ReferenceBoardStore.contentX += deltaX;
    $ReferenceBoardStore.contentY += deltaY;
    $ReferenceBoardStore.backgroundX += deltaX;
    $ReferenceBoardStore.backgroundY += deltaY;
  }

  function handleMouseUp() {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    if (!isDraggingWorkspace) {
      $ReferenceBoardStore.selectedWindows = []; // Reset selectedWindows for empty area click
    }
  }

  // #################################################### //
  // zoom functionality
  // https://stackoverflow.com/a/3151987
  const scaleStep = 0.1; // Adjust the scaling step for smoother zoom
  function handleWheel(event) {
    if (!isWindowActive) return;
    event.preventDefault();


    // Get mouse offset relative to the event's current target
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.pageX - rect.left;
    const mouseY = event.pageY - rect.top;

    // Normalize mouse wheel to +1 or -1
    const wheel = event.deltaY < 0 ? 1 : -1;

    // Compute zoom factor
    const zoom = Math.exp(wheel * scaleStep);

    // Compute the new scale
    let newScale = $ReferenceBoardStore.scale * zoom;
    let newBackgroundScale = $ReferenceBoardStore.backgroundScale * zoom;

    // Ensure the scale doesn't get too small or too large
    if (newScale > 0.05 && newScale < 7) {
      // Adjust contentX and contentY to keep the mouse point constant
      // The formula here is a bit different from Stack overflow answer!
      // We first take the delta of content to the mouse position multiplied by the ratio of scales,
      // then add the mouse position to the content. This value is then assigned to the new value of the content (for X and Y)
      $ReferenceBoardStore.contentX =
        ($ReferenceBoardStore.contentX - mouseX) *
          (newScale / $ReferenceBoardStore.scale) +
        mouseX;
      $ReferenceBoardStore.contentY =
        ($ReferenceBoardStore.contentY - mouseY) *
          (newScale / $ReferenceBoardStore.scale) +
        mouseY;

        
      $ReferenceBoardStore.backgroundX = $ReferenceBoardStore.contentX;
      $ReferenceBoardStore.backgroundY = $ReferenceBoardStore.contentY;

      // Apply the new scale
      $ReferenceBoardStore.scale = newScale;
      $ReferenceBoardStore.backgroundScale = newBackgroundScale;
    }
  }

  // #################################################### //
  // Reset Workspace Position
  // DONT GET WINDOW DIMENSIONS
  // GET APP WINDOW WRAPPER DIMENSIONS
  function resetWorkspacePosition() {
    $ReferenceBoardStore.contentX =
      window.innerWidth / 2 - $ReferenceBoardStore.contentWidth / 2;
    $ReferenceBoardStore.contentY =
      window.innerHeight / 2 - $ReferenceBoardStore.contentHeight / 2;
    $ReferenceBoardStore.scale = 1;
    $ReferenceBoardStore.backgroundScale = 1;
  }

  // #################################################### //
  // Handle Click Event for Empty Area in Workspace
  // function handleWorkspaceClick() {
  //   if (isDraggingWorkspace) {
  //     isDraggingWorkspace = false;
  //     return;
  //   }
  //   if ($workspaceStore.isAWindowActivated) {
  //     $workspaceStore.isAWindowActivated = false;
  //     windowPropertyStores.forEach((store) => {
  //       if (get(store).isActiveApp == true) {
  //         updateWindowStore(get(store).windowId, (props) => {
  //           props.isActiveApp = false;
  //           return props;
  //         });
  //       }
  //     });
  //   }
  // }

  function handleKeyPress(event) {
    if (event.key === "Home" || event.code === "Home") {
      resetWorkspacePosition();
    }
  }

  // Function to handle dragging
  let isDragging = false;
  let hasMoved = false;

  // minimize if last screen was fullscreen
  // if ($properties.isFullscreen) {
  //   maximize_window();
  // }

  function dragStart(e) {
    // if (
    //   $properties.isFullscreen ||
    //   resizing ||
    //   $workspaceStore.isAWindowActivated
    // )
    //   return;
    e.preventDefault();
    e.stopPropagation();
    // const index = $workspaceStore.selectedWindows.indexOf($properties.windowId);
    // if (index === -1) {
    //   return;
    // }
    isDragging = true;
    window.addEventListener("mousemove", dragMove);
    window.addEventListener("mouseup", dragEnd);
  }

  function dragMove(e) {
    e.preventDefault();
    e.stopPropagation();
    // if ($properties.id != 1) {
    //   zIndex = 3;
    // } else if ($properties.id === 1) {
    //   // is a frame
    //   zIndex = 1;
    // }
    // if (isDragging) {
    //   hasMoved = true;
    //   if ($workspaceStore.selectedWindows.length < 2) {
    //     $properties.x += e.movementX / scale;
    //     $properties.y += e.movementY / scale;

    //     if ($properties.id == 1) {
    //       for (const windowApp of windowPropertyStores) {
    //         if (get(windowApp).isInsideFrameId != $properties.windowId)
    //           continue;
    //         updateWindowStore(get(windowApp).windowId, (windowProperties) => {
    //           windowProperties.x += e.movementX / scale;
    //           windowProperties.y += e.movementY / scale;
    //           return windowProperties;
    //         });
    //       }
    //     }
    //   } else if ($workspaceStore.selectedWindows.length > 1) {
    //     // Move all selected windows
    //     // if a selected window is in frame, check that frame boundary
    //     // if a selected window IS A FRAME, update locations of all NON SELECTED windows of THAT FRAME
    //     for (const windowId of $workspaceStore.selectedWindows) {
    //       updateWindowStore(windowId, (windowProperties) => {
    //         windowProperties.x += e.movementX / scale;
    //         windowProperties.y += e.movementY / scale;
    //         if (windowProperties.isInsideFrameId != 0) {
    //           checkFrameBoundaries(windowProperties.isInsideFrameId);
    //         }
    //         if (windowProperties.id == 1) {
    //           for (const windowApp of windowPropertyStores) {
    //             if (
    //               get(windowApp).isInsideFrameId != windowProperties.windowId ||
    //               $workspaceStore.selectedWindows.includes(
    //                 get(windowApp).windowId
    //               )
    //             )
    //               continue;
    //             updateWindowStore(
    //               get(windowApp).windowId,
    //               (windowPropertiesInsideFrame) => {
    //                 windowPropertiesInsideFrame.x += e.movementX / scale;
    //                 windowPropertiesInsideFrame.y += e.movementY / scale;
    //                 return windowPropertiesInsideFrame;
    //               }
    //             );
    //           }
    //         }
    //         return windowProperties;
    //       });
    //     }
    //   }
    //   checkBoundaries();
    //   if (!e.shiftKey) {
    //     checkFrameBoundaries();
    //   }
    // }
    console.log('supposedly moving images');
  }

  function dragEnd(e) {
    // if (isDragging) {
    //   isDragging = false;
    //   window.removeEventListener("mousemove", dragMove);
    //   window.removeEventListener("mouseup", dragEnd);

      // if ($properties.id == 1) return; // frames dont trigger put inside functionality

      // // console.log(e);
      // const windows = $windowsStore || [];

    //   for (const windowData of windows) {
    //     const windowElem = document.getElementById(
    //       `frame-${windowData.windowId}`
    //     );
    //     if (windowElem) {
    //       // check if event e was performed "on" the element windowElem
    //       // which means basicaly check if the dragEnd happen on the element.
    //       const windowRect = windowElem.getBoundingClientRect();

    //       // Check if the dragEnd event occurred within the bounds of the windowElem
    //       const withinBounds =
    //         e.clientX >= windowRect.left &&
    //         e.clientX <= windowRect.right &&
    //         e.clientY >= windowRect.top &&
    //         e.clientY <= windowRect.bottom;

    //       if (withinBounds && $properties.isInsideFrameId == 0) {
    //         console.log("setting properties to ", windowData.windowId);
    //         $properties.isInsideFrameId = windowData.windowId;
    //         windowsStore.update((w) => {
    //           w.forEach((appData) => {
    //             appData.windowId == $properties.windowId
    //               ? (appData.isInsideFrameId = windowData.windowId)
    //               : appData;
    //           });
    //           return w;
    //         });
    //         updateWindowStore($properties.windowId, (windowProperties) => {
    //           windowProperties.isInsideFrameId = windowData.windowId;
    //           console.log("windows store updaetd");
    //           return windowProperties;
    //         });
    //         checkFrameBoundaries();
    //       } else if (
    //         !withinBounds &&
    //         $properties.isInsideFrameId == windowData.windowId
    //       ) {
    //         console.log("out of bounds");
    //         let frameId = $properties.isInsideFrameId;
    //         $properties.isInsideFrameId = 0;
    //         windowsStore.update((w) => {
    //           w.forEach((appData) =>
    //             appData.windowId == $properties.windowId
    //               ? (appData.isInsideFrameId = 0)
    //               : appData
    //           );
    //           return w;
    //         });
    //         updateWindowStore($properties.windowId, (windowProperties) => {
    //           windowProperties.isInsideFrameId = 0;
    //           return windowProperties;
    //         });
    //         checkFrameBoundaries(frameId);
    //       }
    //     }
    //   }
    // }
  }

  // $: ReferenceBoardStore.images = images;

  onMount(async () => {
    // clearIndexedDB()
    console.log("initializing ", dbName);
    db = await initializeDB(dbName, storeName);
    await loadImagesFromDB();

    console.log("I am a good  reference board");
  });

  async function loadImagesFromDB() {
    const transaction = db.transaction([storeName], "readonly");
    const objectStore = transaction.objectStore(storeName);
    const cursor = objectStore.openCursor();

    cursor.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const imageUrl = cursor.value.imageUrl;
        const key = cursor.value.key;
        addImageToContainer(imageUrl, key);
        cursor.continue();
      }
    };

    cursor.onerror = (event) => {
      console.error("Error reading from IndexedDB", event.target.error);
    };
  }

  function handlePaste(event) {
    console.log(event);
    const items = event.clipboardData.items;

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (item.kind === "file" && item.type.includes("image")) {
        const blob = item.getAsFile();
        const reader = new FileReader();

        reader.onload = function (e) {
          const imageUrl = e.target.result;
          const key = `ref-img-${nowStr()}`;
          addImageToContainer(imageUrl, key);
          saveImageToDB(imageUrl, key, db, storeName);
        };

        reader.readAsDataURL(blob);
      }
    }
  }

  function addImageToContainer(imageUrl, key) {
    // Ensure a unique key for each image
    images = [...images, { imageUrl, key }];
  }

  async function clearIndexedDB() {
    clearDB(dbName);
    // Optional: You may want to re-initialize the database after clearing it
    // db = await initializeDB(dbName, storeName);
    images = []; // Clear the images array in your component
  }

  function pasteEvent(event) {
    console.log(windowId, event);
    handlePaste(event);
  }
</script>


{#if showIcon}
  {#if images[0]}
  <img src={images[0].imageUrl} alt="Icon" class="icon" />
  {:else}
  <img src='./icons/icon-192x192.png' alt="Icon" class="icon" />

  {/if}
{:else}

<div
  id="referenceboard-app"
  on:mouseenter={() => self.addEventListener("paste", pasteEvent)}
  on:mouseleave={() => self.removeEventListener("paste", pasteEvent)}
  on:focus
  on:mouseover={() => {}}
>
  <button on:click={clearIndexedDB}>Clear IndexedDB</button>

  <div
  bind:this={referenceAppElement}
    id="imageboard-workspace-{windowId}"
    class="workspace"
    style="
      background-position: {$ReferenceBoardStore.backgroundX}px {$ReferenceBoardStore.backgroundY}px; 
      background-size: {80 * $ReferenceBoardStore.backgroundScale}px {80 * $ReferenceBoardStore.backgroundScale}px;
  "
    on:wheel={handleWheel}
    on:mousedown={handleMouseDown}
    on:keydown={handleKeyPress}

  >
    <div

      id="imageboard-content-{windowId}"
      class="content"
      style="
        transform: scale({$ReferenceBoardStore.scale});  
        left: {$ReferenceBoardStore.contentX}px; 
        top: {$ReferenceBoardStore.contentY}px;
        width: {$ReferenceBoardStore.contentWidth}px;
        height: {$ReferenceBoardStore.contentHeight}px; 
      "
    >
      {#each images as { imageUrl, key } (key)}
        <img
          src={imageUrl}
          alt="File from Clipboard"
          {key}
          on:mousedown={dragStart}
        />
      {/each}
    </div>
  </div>
</div>


{/if}

<style>
  #referenceboard-app {
    height: 100%;
    /* overflow: hidden; */
  }
  .workspace {
    position: absolute;
    /* top: 0;
    left: 0; */
    /* width: 100vw;
    height: 100vh; */
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    background-color: white;
    background-image: radial-gradient(black 1px, transparent 0);
    /* overflow: hidden; */
  }
  .content {
    /* display: flex; */
    /* flex-wrap: wrap; */
    /* gap: 10px; */
    /* max-width: 100%; */
    position: absolute;
    transform-origin: 0 0;
    height: 80%;
    background-color: rgba(128, 128, 128, 0.39);
    outline: 1px black solid;
    /* overflow: hidden; */
  }
  /* background-image: radial-gradient(black 1px, transparent 0); */

  img {
    /* flex: 0 0 calc(33.33% - 10px); */
    /* max-width: calc(33.33% - 10px); */
    width: 40%;
    height: auto;
  }
</style>
