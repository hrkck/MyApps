<!-- AppWindow.svelte -->
<script>
  import { afterUpdate, beforeUpdate, onDestroy, onMount } from "svelte";
  import {
    windowLocalStore,
    workspaceStore,
    windowPropertyStores,
    windowsStore,
  } from "../../store";
  import { updateWindowStore } from "../../js/utils";
  import { get } from "svelte/store";
  import { applications } from "../../applicationsList";

  export let now;
  export let scale;
  export let onClose = () => {};
  export let selected = false;

  export let properties = windowLocalStore(now);
  // check if this window is new or from localstorage
  // dont add to the stores if else (which means ...
  // ... the app changed location from workspace into frame ...
  // or vice versa
  let isNewApp = true;
  for (const windowStore of windowPropertyStores) {
    if (get(windowStore).windowId == $properties.windowId) {
      isNewApp = false; // this app is just changing location in DOM
      break;
    }
  }
  if (isNewApp) {
    windowPropertyStores.push(properties);
  }

  let thisAppWindow;
  let zIndex = 2;
  if ($properties.id === 1) {
    // is frame
    zIndex = 1;
  }

  // Additional property to track whether to show the icon or content
  let showIcon = false;

  // Function to handle dragging
  let isDragging = false;
  let hasMoved = false;

  // minimize if last screen was fullscreen
  // if ($properties.isFullscreen) {
  //   maximize_window();
  // }

  function dragStart(e) {
    if (
      $properties.isFullscreen ||
      resizing ||
      $workspaceStore.isAWindowActivated
    )
      return;
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
    if ($properties.id != 1) {
      zIndex = 3;
    } else if ($properties.id === 1) {
      // is a frame
      zIndex = 1;
    }
    if (isDragging) {
      hasMoved = true;
      if ($workspaceStore.selectedWindows.length < 2) {
        $properties.x += e.movementX / scale;
        $properties.y += e.movementY / scale;

        if ($properties.id == 1) {
          for (const windowApp of windowPropertyStores) {
            if (get(windowApp).isInsideFrameId != $properties.windowId)
              continue;
            updateWindowStore(get(windowApp).windowId, (windowProperties) => {
              windowProperties.x += e.movementX / scale;
              windowProperties.y += e.movementY / scale;
              return windowProperties;
            });
          }
        }
      } else if ($workspaceStore.selectedWindows.length > 1) {
        // Move all selected windows
        // if a selected window is in frame, check that frame boundary
        // if a selected window IS A FRAME, update locations of all NON SELECTED windows of THAT FRAME
        for (const windowId of $workspaceStore.selectedWindows) {
          updateWindowStore(windowId, (windowProperties) => {
            windowProperties.x += e.movementX / scale;
            windowProperties.y += e.movementY / scale;
            if (windowProperties.isInsideFrameId != 0) {
              checkFrameBoundaries(windowProperties.isInsideFrameId);
            }
            if (windowProperties.id == 1) {
              for (const windowApp of windowPropertyStores) {
                if (
                  get(windowApp).isInsideFrameId != windowProperties.windowId ||
                  $workspaceStore.selectedWindows.includes(
                    get(windowApp).windowId
                  )
                )
                  continue;
                updateWindowStore(
                  get(windowApp).windowId,
                  (windowPropertiesInsideFrame) => {
                    windowPropertiesInsideFrame.x += e.movementX / scale;
                    windowPropertiesInsideFrame.y += e.movementY / scale;
                    return windowPropertiesInsideFrame;
                  }
                );
              }
            }
            return windowProperties;
          });
        }
      }
      checkBoundaries();
      if (!e.shiftKey) {
        checkFrameBoundaries();
      }
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
              });
              return w;
            });
            updateWindowStore($properties.windowId, (windowProperties) => {
              windowProperties.isInsideFrameId = windowData.windowId;
              console.log("windows store updaetd");
              return windowProperties;
            });
            checkFrameBoundaries();
          } else if (
            !withinBounds &&
            $properties.isInsideFrameId == windowData.windowId
          ) {
            console.log("out of bounds");
            let frameId = $properties.isInsideFrameId;
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
            checkFrameBoundaries(frameId);
          }
        }
      }
    }
  }

  // #################################################### //
  // Handle 'F' Key Press
  // function maximize_window() {
  //   if ($properties.isFullscreen) {
  //     $properties.isFullscreen = false;
  //     $workspaceStore.isAWindowMaximized = false;
  //     $workspaceStore.scale = $workspaceStore.workspaceScaleBeforeMaximize;
  //     $properties.x = $properties.xBeforeMaximize;
  //     $properties.y = $properties.yBeforeMaximize;
  //     $properties.width = 320;
  //     $properties.height = 240;
  //     $workspaceStore.contentX = $properties.contentXBeforeMaximize;
  //     $workspaceStore.contentY = $properties.contentYBeforeMaximize;
  //     zIndex = 2;
  //     setTimeout(() => {
  //       $properties.transition_anim = "";
  //     }, 300);
  //   } else {
  //     // If not fullscreen, maximize the window
  //     zIndex = 4;
  //     $workspaceStore.isAWindowMaximized = true;
  //     $properties.isFullscreen = true;
  //     $workspaceStore.workspaceScaleBeforeMaximize = $workspaceStore.scale;
  //     $workspaceStore.scale = 1;
  //     $properties.xBeforeMaximize = $properties.x;
  //     $properties.yBeforeMaximize = $properties.y;
  //     $properties.x = 0;
  //     $properties.y = 0;
  //     $properties.width = 1920;
  //     $properties.height = 1080;
  //     $properties.contentXBeforeMaximize = $workspaceStore.contentX;
  //     $properties.contentYBeforeMaximize = $workspaceStore.contentY;
  //     $workspaceStore.contentX = 0;
  //     $workspaceStore.contentY = 0;
  //     $properties.transition_anim = "app-transition-anim";
  //   }
  // }

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
    console.log("most recent v4");
    console.log(resizing);
    if (resizing) {
      event.stopPropagation();
      resizing = false;
      return;
    }
    if ($properties.isFullscreen && selected) return;
    event.stopPropagation(); // Prevent the click event from propagating to the workspace
    if ($properties.id != 1) {
      zIndex = 3;
    } else if ($properties.id === 1) {
      // is frame
      zIndex = 1;
    }
    if (!hasMoved) {
      if (event.ctrlKey) {
        // If CTRL is pressed, add or remove the window from the selection
        toggleWindowSelection(windowId);
        // Then  if a window is active, deactivate it
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
      } else {
        // If CTRL is not pressed, and target window is not already the sole window selected, then reset the selection and select the clicked window
        if ($workspaceStore.selectedWindows.length === 1) {
          if ($workspaceStore.selectedWindows[0] == $properties.windowId) {
            // a single window is selected, and user clicked on that window again ...
            // previously we would unselect it, now we toggle between selected - active
            if ($properties.id != 1) {
              if (!$properties.isActiveApp && !showIcon) {
                $properties.isActiveApp = true;
                $workspaceStore.isAWindowActivated = true;
              }
            } else {
              // old unselect behavior for frames
              $workspaceStore.selectedWindows = [];
              console.log("unselecting");
              zIndex = 1;
            }
          } else {
            console.log("selecting a new single window");
            // first if a window is active, deactivate it
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
            $workspaceStore.selectedWindows = [windowId];
          }
        } else {
          $workspaceStore.selectedWindows = [windowId];
        }
      }
    } else {
      // used in Icon click prevent default (importnat for link apps)
      hasMoved = false;
    }
  }

  // function handleKeyPress(event) {
  //   if (event.key === "F" || event.code === "KeyF") {
  //     maximize_window();
  //   }
  // }

  function checkShowIcon() {
    // Set showIcon based on the scale
    showIcon = !$properties.isFullscreen;
    showIcon =
      $properties.width * scale < window.innerWidth / 4 &&
      $properties.height * scale < window.innerHeight / 4 &&
      $properties.id != 1;

    // if(!showIcon) console.log( $properties.name , $properties.width * scale , $properties.width * scale < window.innerWidth / 2);
    // $properties.width
    // $properties.height
  }

  function checkFrameBoundaries(excludeCallerOrFrameID = false) {
    let frameId;
    if (!excludeCallerOrFrameID) {
      if ($properties.isInsideFrameId == 0) {
        return;
      } else {
        frameId = $properties.isInsideFrameId;
      }
    } else {
      frameId = excludeCallerOrFrameID;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    windowPropertyStores.forEach((store) => {
      const windowProps = get(store);
      if (windowProps.isInsideFrameId != frameId) return;
      const windowElement = document.getElementById(
        `app-${windowProps.windowId}`
      );
      if (windowElement) {
        minX = Math.min(minX, windowProps.x);
        minY = Math.min(minY, windowProps.y);
        maxX = Math.max(maxX, windowProps.x + windowProps.width);
        maxY = Math.max(maxY, windowProps.y + windowProps.height);
      }
    });

    let padding = 50;
    const containingRect = {
      left: minX - padding,
      top: minY - padding,
      right: maxX + padding,
      bottom: maxY + padding,
    };

    const minWidth = 320;
    const minHeight = 240;

    if (
      containingRect.left == Infinity &&
      containingRect.top == Infinity &&
      containingRect.right == -Infinity &&
      containingRect.bottom == -Infinity
    ) {
      // if frame empty, give min width & height
      updateWindowStore(frameId, (frameProperties) => {
        frameProperties.width = minWidth;
        frameProperties.height = minHeight;
        return frameProperties;
      });
    } else {
      updateWindowStore(frameId, (frameProperties) => {
        frameProperties.x = containingRect.left;
        frameProperties.width = containingRect.right - containingRect.left;
        frameProperties.y = containingRect.top;
        frameProperties.height = containingRect.bottom - containingRect.top;
        return frameProperties;
      });
    }
  }

  // checks if window should extend #content tags boundaries
  function checkBoundaries(excludeCaller = false) {
    var parent = document.getElementById("content");
    var parentRect = parent.getBoundingClientRect();
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    windowPropertyStores.forEach((store) => {
      const windowProps = get(store);
      const windowElement =
        document.getElementById(`app-${windowProps.windowId}`) ||
        document.getElementById(`frame-${windowProps.windowId}`);
      if (windowElement && excludeCaller != windowProps.windowId) {
        const rect = windowElement.getBoundingClientRect();
        minX = Math.min(minX, rect.left);
        minY = Math.min(minY, rect.top);
        maxX = Math.max(maxX, rect.right);
        maxY = Math.max(maxY, rect.bottom);
      }
    });
    let padding = 25;
    const containingRect = {
      left: minX - padding,
      top: minY - padding,
      right: maxX + padding,
      bottom: maxY + padding,
    };
    const deltaX = parentRect.left - containingRect.left;
    const deltaY = parentRect.top - containingRect.top;
    $workspaceStore.contentX = containingRect.left;
    $workspaceStore.contentY = containingRect.top;
    $workspaceStore.contentWidth =
      (containingRect.right - parentRect.left) / scale;
    $workspaceStore.contentHeight =
      (containingRect.bottom - parentRect.top) / scale;
    for (const windowApp of windowPropertyStores) {
      updateWindowStore(get(windowApp).windowId, (windowProperties) => {
        windowProperties.x += deltaX / scale;
        windowProperties.y += deltaY / scale;
        return windowProperties;
      });
    }
  }

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

  // Function to handle resizing from the bottom edge
  // Many thanks to // https://svelte.dev/repl/8b974ea483c648fba362a1e9f3dbc29f?version=4.2.10
  let resizing = false;
  function resize(element) {
    if ($properties.id == 1) return; // frame are not resizable
    const right = document.createElement("div");
    right.direction = "east";
    right.classList.add("grabber");
    right.classList.add("right");

    const left = document.createElement("div");
    left.direction = "west";
    left.classList.add("grabber");
    left.classList.add("left");

    // const top = document.createElement('div')
    // top.direction = 'north'
    // top.classList.add('grabber')
    // top.classList.add('top')

    const bottom = document.createElement("div");
    bottom.direction = "south";
    bottom.classList.add("grabber");
    bottom.classList.add("bottom");

    // const topLeft = document.createElement('div')
    // topLeft.direction = 'northwest'
    // topLeft.classList.add('grabber')
    // topLeft.classList.add('top-left')

    // const topRight = document.createElement('div')
    // topRight.direction = 'northeast'
    // topRight.classList.add('grabber')
    // topRight.classList.add('top-right')

    const bottomLeft = document.createElement("div");
    bottomLeft.direction = "southwest";
    bottomLeft.classList.add("grabber");
    bottomLeft.classList.add("bottom-left");

    const bottomRight = document.createElement("div");
    bottomRight.direction = "southeast";
    bottomRight.classList.add("grabber");
    bottomRight.classList.add("bottom-right");

    // const grabbers = [right, left, top, bottom, topLeft, topRight, bottomLeft, bottomRight]
    const grabbers = [right, left, bottom, bottomLeft, bottomRight];

    let active = null,
      initialRect = null,
      initialPos = null;

    grabbers.forEach((grabber) => {
      element.appendChild(grabber);
      grabber.addEventListener("mousedown", onMousedown);
    });

    function onMousedown(event) {
      event.stopPropagation();
      if ($properties.isActiveApp) {
        console.log("unactivate the window before resizing");
        event.preventDefault();
        return;
      }
      resizing = true;
      active = event.target;
      const rect = element.getBoundingClientRect();
      const parent = element.parentElement.getBoundingClientRect();

      initialRect = {
        width: $properties.width,
        height: $properties.height,
        left: $properties.x,
        right: $properties.x + $properties.width,
        top: $properties.y,
        bottom: $properties.y + $properties.height,
      };
      initialPos = { x: event.pageX, y: event.pageY };
      active.classList.add("selected");
    }

    function onMouseup(event) {
      if (!active) return;
      // resizing = false; // we make resizing false in handlewindowclick
      active.classList.remove("selected");
      active = null;
      initialRect = null;
      initialPos = null;
    }

    const minWidth = 80;
    const minHeight = 80;

    function onMove(event) {
      if (!active) return;

      const direction = active.direction;
      let delta;

      if (direction.match("east")) {
        delta = (event.pageX - initialPos.x) / scale;
        $properties.width = Math.max(initialRect.width + delta, minWidth);
      }

      if (direction.match("west")) {
        delta = (initialPos.x - event.pageX) / scale;
        $properties.x = initialRect.left - delta;
        $properties.width = Math.max(initialRect.width + delta, minWidth);
      }

      if (direction.match("north")) {
        delta = (initialPos.y - event.pageY) / scale;
        $properties.y = initialRect.top - delta;
        $properties.height = Math.max(initialRect.height + delta, minHeight);
      }

      if (direction.match("south")) {
        delta = (event.pageY - initialPos.y) / scale;
        $properties.height = Math.max(initialRect.height + delta, minHeight);
      }
      checkFrameBoundaries();
      checkBoundaries();
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onMouseup);

    return {
      destroy() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mousemove", onMousedown);

        grabbers.forEach((grabber) => {
          element.removeChild(grabber);
        });
      },
    };
  }
  let grabber = false;

  // ###########
  // Icon click:
  function iconClick(event) {
    if (hasMoved) {
      event.preventDefault();
      return;
    }
    console.log("clicked icon");
  }

  // Check the scale on mount and after update
  afterUpdate(() => {
    // if ($workspaceStore.selectedWindows.length === 1) {
    //   if ($workspaceStore.selectedWindows[0] != $properties.windowId) {
    //     window.removeEventListener("keydown", handleKeyPress);
    //   } else {
    //     window.addEventListener("keydown", handleKeyPress);
    //   }
    // } else {
    //   window.removeEventListener("keydown", handleKeyPress);
    // }
  });

  onMount(() => {
    checkShowIcon();
    setTimeout(() => {
      checkBoundaries();
      if ($properties.isInsideFrameId != 0) {
        checkFrameBoundaries();
      }
    }, 100);
    console.log("hello to this window ");
  });

  beforeUpdate(() => {
    checkShowIcon();
  });

  onDestroy(() => {
    console.log("goodbye to this window ");
    let frameId = $properties.isInsideFrameId;
    $properties.isInsideFrameId = 0;
    checkFrameBoundaries(frameId);
    checkBoundaries($properties.windowId);
  });
</script>

<div
  id="{$properties.id == 1 ? 'frame' : 'app'}-{$properties.windowId}"
  class="{$properties.id == 1 ? 'frame-window' : 'app-window'} 
    {$properties.isFullscreen
    ? 'maximized app-transition-anim'
    : ''} {$properties.transition_anim}"
  class:hide-grabber={!grabber}
  style="
  left: {$properties.x}px; 
  top: {$properties.y}px; 
  width: {$properties.width}px;
  height: {$properties.height}px;
  outline: {$properties.isActiveApp
    ? '6px solid green'
    : selected
      ? '3px solid red'
      : 'none'};
  z-index: {zIndex};"
  on:mousedown={dragStart}
  on:click={(event) => {
    handleWindowClick(event, $properties.windowId)
  }}
  on:keydown
  on:keyup
  on:keypress
  on:touchstart={touchStart}
  on:touchmove={touchMove}
  bind:this={thisAppWindow}
  use:resize
>
  {#if $properties.id != 1}
    <!-- Frames dont have headers-->
    <div class="window-header app-header">
      <div class="app-name">
        {$properties.name}
      </div>
      <input
        type="button"
        value="X"
        class="close-button"
        style="
      background-color: {$properties.isFullscreen ? 'darkred' : 'red'};
      "
        on:click={() => {
          onClose();
        }}
        on:touchstart={onClose}
        on:keydown,
        on:keyup
        on:keypress
        disabled={$properties.isFullscreen}
      />
    </div>
  {/if}
  <div class="window-content app-content">
    {#if applications[$properties.id - 1]}<!-- add frame -->
      {#if $properties.id == 1}
        <svelte:component this={applications[$properties.id - 1].content} />
      {:else} <!-- else add a window -->
        <svelte:component
          this={applications[$properties.id - 1].content}
          windowId={$properties.windowId}
          bind:windowIconUrl={$properties.windowIconUrl}
          bind:showIcon
          bind:isWindowActive={$properties.isActiveApp}
        />
      {/if}
    {/if}
  </div>
</div>

<style>
  .app-window {
    position: absolute;
    text-align: center;
    border: 1px solid #d3d3d3;
    background-color: white;
    z-index: 2;
    box-shadow: 5px 10px 8px #252525;
    user-select: none;
  }

  .frame-window {
    position: absolute;
    text-align: center;
    border: 1px solid #d3d3d3;
    background-color: rgba(138, 138, 138, 0.205);
    z-index: 1;
    box-shadow: 5px 10px 8px #888888;
  }

  .app-transition-anim {
    transition:
      width 0.3s ease,
      height 0.3s ease,
      transform 0.3s ease,
      top 0.5s ease,
      left 0.5s ease;
  }

  .maximized {
    position: absolute !important;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    transform: translateX(100vw);
    transition:
      width 0.7s ease,
      height 0.7s ease,
      transform 0.7s ease,
      top 0.7s cubic-bezier(0, 1.31, 0.97, 0.58),
      left 0.7s cubic-bezier(0, 1.31, 0.97, 0.58);
  }

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
    top: 30px;
    bottom: 0;
    display: block;
    /* align-items: center;
    justify-content: space-around; */
    overflow: hidden;
  }

  .close-button {
    border-radius: 5px;
    background-color: red;
    color: white;
    font-weight: bold;
    cursor: pointer;
    margin-right: 10px;
  }



  :global(.grabber) {
    position: absolute;
    box-sizing: border-box;
  }

  :global(.grabber.right) {
    width: 10px;
    height: 100%;
    background: red;
    right: -5px;
    cursor: col-resize;
    top: 0;
  }

  :global(.grabber.left) {
    width: 10px;
    height: 100%;
    background: blue;
    left: -5px;
    cursor: col-resize;
    top: 0;
  }

  :global(.grabber.top) {
    height: 10px;
    width: 100%;
    background: green;
    top: -5px;
    cursor: row-resize;
  }

  :global(.grabber.bottom) {
    height: 10px;
    width: 100%;
    background: orange;
    bottom: -5px;
    cursor: row-resize;
  }

  :global(.grabber.top-left) {
    height: 20px;
    width: 20px;
    background: orange;
    top: -10px;
    left: -10px;
    cursor: nw-resize;
    border-radius: 100%;
  }

  :global(.grabber.top-right) {
    height: 20px;
    width: 20px;
    background: orange;
    top: -10px;
    right: -10px;
    cursor: ne-resize;
    border-radius: 100%;
  }

  :global(.grabber.bottom-left) {
    height: 20px;
    width: 20px;
    background: green;
    bottom: -10px;
    left: -10px;
    cursor: sw-resize;
    border-radius: 100%;
  }

  :global(.grabber.bottom-right) {
    height: 20px;
    width: 20px;
    background: green;
    bottom: -10px;
    right: -10px;
    cursor: se-resize;
    border-radius: 100%;
  }

  :global(.hide-grabber .grabber) {
    background: transparent !important;
    border: none !important;
  }

  :global(.grabber.selected) {
    border: solid 1px black;
  }
</style>
