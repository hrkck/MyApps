<!-- THIS IS AN OLD CODE -- ALMOST EQUALS TO TRASH // -->
///
<!-- AppWindow.svelte -->
<script>
  import { afterUpdate, onDestroy, onMount, tick } from "svelte";
  import { workspaceStore, windowPropertyStores, windowsStore } from "../../store";
  import { updateWindowStore } from "../../js/utils";
  import TextEditor from "../Apps/TextEditor.svelte";
  import ReferenceBoard from "../Apps/ReferenceBoard.svelte";
  import TodoApp from "../Apps/TodoApp.svelte";
  import { get } from "svelte/store";
  import DateApp from "../Apps/DateApp.svelte";
  import FrameWindow from "../Apps/FrameWindow.svelte";

  export let now;
  export let scale;
  export let onClose = () => {};
  export let selected = false;

  export let properties = windowPropertyStores.find(
    (obj) => obj.windowId === now
  );

  // Define a mapping object for components
  const componentMap = {
    2: DateApp,
    3: TextEditor,
    4: ReferenceBoard,
    5: TodoApp,
    1: FrameWindow,
    // Add more mappings as needed
  };

  let thisAppWindow;
  let zIndex = 2;

  let transition_anim = "";

  // Additional property to track whether to show the icon or content
  let showIcon = false;

  // Function to handle dragging
  let isDragging = false;
  let hasMoved = false;

  function dragStart(e) {
    if ($properties.isFullscreen) return;
    e.preventDefault();
    e.stopPropagation();
    const index = $workspaceStore.selectedWindows.indexOf($properties.windowId);
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
    zIndex = 2;
    if (isDragging) {
      hasMoved = true;
      if ($workspaceStore.selectedWindows.length < 2) {
        $properties.x += e.movementX / scale;
        $properties.y += e.movementY / scale;
        // $properties.width += e.movementY / scale;
      } else if ($workspaceStore.selectedWindows.length > 1) {
        // Move all selected windows
        for (const windowId of $workspaceStore.selectedWindows) {
          updateWindowStore(windowId, (windowProperties) => {
            windowProperties.x += e.movementX / scale;
            windowProperties.y += e.movementY / scale;
            return windowProperties;
          });
        }
      }
      checkBoundaries();
    }
  }

  function dragEnd(e) {
    if (isDragging) {
      isDragging = false;
      window.removeEventListener("mousemove", dragMove);
      window.removeEventListener("mouseup", dragEnd);

      if ($properties.id == 1) return; // frames dont trigger put inside functionality
      // console.log(e);
      const windows = $windowsStore || [];

      for (const windowData of windows) {
        const windowElem = document.getElementById(
          `frame-${windowData.windowId}`
        );
        if (windowElem) {
          // check if event e was performed "on" the element windowElem
          // which means basicaly check if the dragEnd happen on the element.
          const windowRect = windowElem.getBoundingClientRect();

          // Check if the dragEnd event occurred within the bounds of the windowElem
          const withinBounds =
            e.clientX >= windowRect.left &&
            e.clientX <= windowRect.right &&
            e.clientY >= windowRect.top &&
            e.clientY <= windowRect.bottom;

          if (withinBounds && $properties.isInsideFrameId == 0) {
            console.log("setting properties to ", windowData.windowId);
            $properties.isInsideFrameId = windowData.windowId;
            windowsStore.update((w) => {
              w.forEach((appData) => {
                appData.windowId == $properties.windowId
                  ? (appData.isInsideFrameId = windowData.windowId)
                  : appData;
                appData.x = (e.clientX - windowRect.left) / scale;
                appData.y = (e.clientY - windowRect.top) / scale;
              });
              return w;
            });
            updateWindowStore($properties.windowId, (windowProperties) => {
              windowProperties.isInsideFrameId = windowData.windowId;
              windowProperties.x = (e.clientX - windowRect.left) / scale;
              windowProperties.y = (e.clientY - windowRect.top) / scale;
              console.log("windows store updaetd");
              return windowProperties;
            });

            // refresh the page to get rid of annoying
            // new app in frame top/left resize problem
            location.reload();
          } else if (
            !withinBounds &&
            $properties.isInsideFrameId == windowData.windowId
          ) {
            console.log("out of bounds");
            $properties.isInsideFrameId = 0;
            windowsStore.update((w) => {
              w.forEach((appData) =>
                appData.windowId == $properties.windowId
                  ? (appData.isInsideFrameId = 0)
                  : appData
              );
              return w;
            });
            updateWindowStore($properties.windowId, (windowProperties) => {
              windowProperties.isInsideFrameId = 0;
              return windowProperties;
            });
          }
        }
      }
      // windowPropertyStores.forEach(windowStore => {
      //   console.log(get(windowStore).isInsideFrameId);
      // })
    }
  }



  // #################################################### //
  // Window Selection Functionality
  function toggleWindowSelection(windowId) {
    const index = $workspaceStore.selectedWindows.indexOf(windowId);
    if (index === -1) {
      // Window is not selected, so add it to the selectedWindows array
      $workspaceStore.selectedWindows = [
        ...$workspaceStore.selectedWindows,
        windowId,
      ];
    } else {
      // Window is selected, so remove it from the selectedWindows array
      $workspaceStore.selectedWindows.splice(index, 1);
      $workspaceStore.selectedWindows = $workspaceStore.selectedWindows;
    }
  }

  // #################################################### //
  // Handle Click Event for Each Window
  function handleWindowClick(event, windowId) {
    if ($properties.isFullscreen && selected) return;
    event.stopPropagation(); // Prevent the click event from propagating to the workspace
    if (!hasMoved) {
      if (event.ctrlKey) {
        // If CTRL is pressed, add or remove the window from the selection
        toggleWindowSelection(windowId);
      } else {
        // If CTRL is not pressed, and target window is not already the sole window selected, then reset the selection and select the clicked window
        if ($workspaceStore.selectedWindows.length === 1) {
          if ($workspaceStore.selectedWindows[0] == $properties.windowId) {
            $workspaceStore.selectedWindows = [];
            zIndex = 1;
          } else {
            $workspaceStore.selectedWindows = [windowId];
          }
        } else {
          $workspaceStore.selectedWindows = [windowId];
        }
      }
    } else {
      hasMoved = false;
    }
  }

  function checkScale() {
    // Set showIcon based on the scale
    showIcon = scale < 1;
  }


  // Check the scale on mount and after update
  afterUpdate(async () => {
    checkScale();
    if ($workspaceStore.selectedWindows.length === 1) {
      if ($workspaceStore.selectedWindows[0] != $properties.windowId) {
        window.removeEventListener("keydown", handleKeyPress);
      } else {
        zIndex = 2;
        window.addEventListener("keydown", handleKeyPress);
      }
    } else {
      window.removeEventListener("keydown", handleKeyPress);
    }
    checkFrameBoundaries();
  });

  onMount(() => {
    checkScale();
    setTimeout(() => {
      checkBoundaries();
    }, 100);
    console.log("hello to this window ", thisAppWindow);
  });

  onDestroy(async () => {
    console.log("goodbye to this window ", thisAppWindow);
  });

  // Touch events for dragging on mobile devices
  // touch events
  let touchStartX = 0;
  let touchStartY = 0;

  function touchStart(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }
  }

  function touchMove(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      $properties.x += deltaX / scale;
      $properties.y += deltaY / scale;
    }
  }
</script>

<div
  id="frame-{$properties.windowId}"
  class="frame-window"
  style="
    left: {$properties.x}px; 
    top: {$properties.y}px; 
    width: {$properties.width}px;
    height: {$properties.height}px;
    outline: {selected ? '3px solid red' : 'none'};
    z-index: {zIndex};"
  on:mousedown={dragStart}
  on:click={(event) => handleWindowClick(event, $properties.windowId)}
  on:keydown
  on:keyup
  on:keypress
  on:touchstart={touchStart}
  on:touchmove={touchMove}
  bind:this={thisAppWindow}
>
  <div class="window-content app-content">
    <!-- Display real content when scale is 1 or more -->
    {#if componentMap[$properties.id]}
      <svelte:component
        this={componentMap[$properties.id]}
        windowId={$properties.windowId}
      />
    {/if}
  </div>
</div>

<style>
  .frame-window {
    position: absolute;
    text-align: center;
    border: 1px solid #d3d3d3;
    background-color: rgba(138, 138, 138, 0.205);
    z-index: 1;
    box-shadow: 5px 10px 8px #888888;
  }

  .app-content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-around;
  }
</style>
