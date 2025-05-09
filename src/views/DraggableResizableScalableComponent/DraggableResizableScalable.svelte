<!--  DraggabkeResizable.svelte -->
<script>
  import { stopPropagation } from 'svelte/legacy';

  import { user } from "../../scripts/initGun";
  import { contentProperties, contextMenu, windowStores } from "../../scripts/storage";
  import { throttle } from "../../scripts/utils";
    import { scale } from 'svelte/transition';


  /**
   * @typedef {Object} Props
   * @property {any} [dragStartFunc]
   * @property {any} [dragMoveFunc]
   * @property {any} [dragEndFunc]
   * @property {any} [resizeStartFunc]
   * @property {any} [resizeMoveFunc]
   * @property {any} [resizeEndFunc]
   * @property {any} [scaleFunc]
   * @property {any} [clickFunc]
   * @property {any} [dbclickFunc]
   * @property {string} [uniqueID]
   * @property {any} store
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let {
    dragStartFunc = function (store, event, x, y) {},
    dragMoveFunc = function (store, event, x, y) {},
    dragEndFunc = function (store, event, x, y) {},
    resizeStartFunc = function (store, event, x, y, width, height) {},
    resizeMoveFunc = function (store, event, x, y, width, height) {},
    resizeEndFunc = function (store, event, x, y, width, height) {},
    scaleFunc = function (store, event, x, y, scale) {},
    clickFunc = function (store, event) {},
    dbclickFunc = function (store, event) {},
    uniqueID = "no-unique-id",
    store,
    children
  } = $props();

  // Draggable
  let isDragging = false;
  function draggable(node) {
    let lastTouchX, lastTouchY; // Track the last touch positions

    const onMove = throttle((event) => {
      if (resizing) return;
      event.preventDefault();
      isDragging = true;

      let dx, dy;
      if (event.type === "mousemove") {
        dx = event.movementX;
        dy = event.movementY;
      } else if (event.touches) {
        const currentTouchX = event.touches[0].clientX;
        const currentTouchY = event.touches[0].clientY;
        if (lastTouchX !== undefined && lastTouchY !== undefined) {
          dx = currentTouchX - lastTouchX;
          dy = currentTouchY - lastTouchY;
        }
        lastTouchX = currentTouchX;
        lastTouchY = currentTouchY;
      }
      if (dx !== undefined && dy !== undefined) {
        $store.x += dx / $store.contentScale;
        $store.y += dy / $store.contentScale;
      }
      dragMoveFunc(store, event, dx / $store.contentScale || 0, dy / $store.contentScale || 0);
    }, 8);

    function onStart(event) {
      if (
        (event.button != 0 && !event.touches) ||
        ($contentProperties.isAWindowActive && !$store.isActiveDraggable) ||
        $contextMenu.visible
      )
        return;
      event.stopPropagation();

      if (event.touches) {
        lastTouchX = event.touches[0].clientX;
        lastTouchY = event.touches[0].clientY;
      }
      // Add move and end listeners
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("touchend", onEnd);

      dragStartFunc(store, event, $store.x, $store.y);
    }

    function onEnd(event) {
      onMove.cancel?.();
      isDragging = false;
      lastTouchX = undefined;
      lastTouchY = undefined;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);

      dragEndFunc(store, event, $store.x, $store.y);
    }

    let target;
    // console.log($store);
    // console.log(target);
    // console.log(node);
    switch ($store.dragEventTarget) {
      case "window":
        target = window;
        break;
      case "node":
        target = node;
        break;
      default:
        target = document.getElementById($store.dragEventTarget);
        // otherwise clikcing on element results in no dragging
        $store.width = 0;
        node.style.minWidth = 0;
        break;
    }

    target.addEventListener("mousedown", onStart);
    target.addEventListener("touchstart", onStart, { passive: false });

    return {
      destroy() {
        target.removeEventListener("mousedown", onStart);
        target.removeEventListener("touchstart", onStart);
        target.removeEventListener("mousemove", onMove);
        target.removeEventListener("mouseup", onEnd);
        target.removeEventListener("touchmove", onMove);
        target.removeEventListener("touchend", onEnd);
      },
    };
  }

  // Function to handle resizing from the bottom edge
  // Many thanks to // https://svelte.dev/repl/8b974ea483c648fba362a1e9f3dbc29f?version=4.2.10
  let resizing = false;
  let grabber = false;
  let aspectRatio = $store.width / $store.height;
  let grabberSize = $derived(5 / $contentProperties.scale); // Base size is 10px

  if ($store.showGrabbers) {
    grabber = true;
  }
  function resize(element) {
    if (!$store.resizable) return;
    const grabbers = [];

    function createGrabber(direction, name) {
      const grabber = document.createElement("div");
      grabber.direction = direction;
      grabber.classList.add("grabber");
      grabber.classList.add(name);
      grabber.id = uniqueID + "-grabber" + name;
      return grabber;
    }

    const right = createGrabber("east", "right");
    const left = createGrabber("west", "left");
    const bottom = createGrabber("south", "bottom");
    const bottomLeft = createGrabber("southwest", "bottom-left");
    const bottomRight = createGrabber("southeast", "bottom-right");

    let top, topLeft, topRight;

    if (!$store.hideHeaderResize) {
      top = createGrabber("north", "top");
      topLeft = createGrabber("northwest", "top-left");
      topRight = createGrabber("northeast", "top-right");

      grabbers.push(right, left, top, bottom, topLeft, topRight, bottomLeft, bottomRight);
    } else {
      grabbers.push(right, left, bottom, bottomLeft, bottomRight);
    }

    let active = null,
      initialRect = null,
      initialPos = null;

    grabbers.forEach((grabber) => {
      element.appendChild(grabber);
      grabber.addEventListener("mousedown", onMouseDown);
    });

    const minWidth = 80;
    const minHeight = 80;

    const onMove = throttle((event) => {
      if (!active || ($contentProperties.isAWindowActive && !$store.isActiveDraggable)) return;

      const direction = active.direction;
      let delta;

      if (initialRect == undefined && initialPos == undefined) {
        console.log("undefined behavior, not resizing.");
        return;
      }

      if (direction.match("east")) {
        delta = (event.pageX - initialPos.x) / $store.contentScale;
        $store.width = Math.max(initialRect.width + delta, minWidth);
      }
      if (direction.match("west")) {
        delta = (initialPos.x - event.pageX) / $store.contentScale;
        if (delta < 0 && $store.width == 80) {
          onMouseUp();
          return;
        }
        $store.x = initialRect.left - delta;
        $store.width = Math.max(initialRect.width + delta, minWidth);
      }
      if (direction.match("north")) {
        delta = (initialPos.y - event.pageY) / $store.contentScale;
        if (delta < 0 && $store.height == 80) {
          onMouseUp();
          return;
        }
        $store.y = initialRect.top - delta;
        $store.height = Math.max(initialRect.height + delta, minHeight);
      }
      if (direction.match("south")) {
        delta = (event.pageY - initialPos.y) / $store.contentScale;
        $store.height = Math.max(initialRect.height + delta, minHeight);
      }

      resizeMoveFunc(store, event, $store.x, $store.y, $store.width, $store.height);
    }, 16);

    function onMouseDown(event) {
      event.stopPropagation();
      //   if ($properties.isActiveApp) {
      //     console.log("unactivate the window before resizing");
      //     event.preventDefault();
      //     return;
      //   }
      grabber = true;

      resizing = true;
      active = event.target;
      initialRect = {
        width: $store.width,
        height: $store.height,
        left: $store.x,
        right: $store.x + $store.width,
        top: $store.y,
        bottom: $store.y + $store.height,
      };
      initialPos = { x: event.pageX, y: event.pageY };
      active.classList.add("selected");

      resizeStartFunc(store, event, $store.x, $store.y, $store.width, $store.height);
    }

    function onMouseUp(event) {
      if (!active) return;
      // resizing = false; // we make resizing false in handlewindowclick
      active.classList.remove("selected");
      active = null;
      initialRect = null;
      initialPos = null;

      resizeEndFunc(store, event, $store.x, $store.y, $store.width, $store.height);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onMouseUp);

    return {
      destroy() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mousemove", onMouseDown);

        grabbers.forEach((grabber) => {
          element.removeChild(grabber);
        });
      },
    };
  }

  // Scalable:
  // #################################################### //
  // zoom functionality
  // https://stackoverflow.com/a/3151987
  const scaleStep = 0.05; // Adjust the scaling step for smoother zoom
  function scalability(node) {
    if (!$store.scalable) return;

    let initialDistance = 0;
    let isScaling = false;

    function changeScale(event, zoom) {
      if ($contentProperties.isAWindowActive && !$store.isActiveDraggable) {
        return;
      }
      const rect = node.parentElement.getBoundingClientRect();
      const mouseX = initialDistance != 0 ? 1 : event.clientX - rect.left;
      const mouseY = initialDistance != 0 ? 1 : event.clientY - rect.top;
      let newScale = $store.scale * zoom;
      
      // apply the scale in callback
      scaleFunc(store, event, mouseX, mouseY, newScale);
    }

    function onMouseWheel(event) {
      if (isScaling || isDragging || resizing) return;
      event.preventDefault();
      const wheel = event.deltaY < 0 ? 1 : -1;
      const zoom = Math.exp(wheel * scaleStep);
      
      if($store.scale == undefined) $store.scale = 1;
      changeScale(event, zoom);
    }
    function onTouchStart(event) {
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );
      }
    }
    function onTouchMove(event) {
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );

        const delta = (currentDistance - initialDistance) * scaleStep * 0.1;
        const zoom = Math.exp(delta);

        changeScale(event, zoom || 1);

        initialDistance = currentDistance;
      }
    }

    function onTouchEnd(event) {
      initialDistance = 0;
    }

    function handleDragStart(event) {
      if (($contentProperties.isAWindowActive && !$store.isActiveDraggable) || $contextMenu.visible)
        return;
      event.stopPropagation();
      isScaling = true;
    }

    function handleDragEnd(event) {
      isScaling = false;
    }

    // Define the throttle limit in fps
    const throttleLimit = 16;

    // Create throttled versions of the high-frequency event handlers
    const throttledMouseWheel = throttle(onMouseWheel, throttleLimit);
    const throttledTouchMove = throttle(onTouchMove, throttleLimit);

    if ($store.useWindow) {
      window.addEventListener("wheel", throttledMouseWheel, { passive: false });
    } else {
      node.addEventListener("wheel", throttledMouseWheel);
      node.addEventListener("mousedown", handleDragStart);
      window.addEventListener("mouseup", handleDragEnd);
    }

    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", throttledTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    // Adding wheel event listener to the target element
    let target;
    switch ($store.dragEventTarget) {
      case "window":
        window.addEventListener("wheel", throttledMouseWheel, { passive: false });
        break;
      default:
        target = document.getElementById($store.dragEventTarget);
        target.addEventListener("wheel", throttledMouseWheel);
        break;
    }

    return {
      destroy() {
        if ($store.useWindow) {
          window.removeEventListener("wheel", throttledMouseWheel);
        } else {
          node.removeEventListener("wheel", throttledMouseWheel);
          node.removeEventListener("mousedown", handleDragStart);
          window.removeEventListener("mouseup", handleDragEnd);
        }
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", throttledTouchMove);
        window.removeEventListener("touchend", onTouchEnd);

        // Remove wheel event listener from the target element
        if (target) {
          target.removeEventListener("wheel", onMouseWheel);
        }
      },
    };
  }

  export function isWindowInAFrame(e) {
    let frameIDs = Object.keys(windowStores).filter((id) => id.startsWith("frame-"));
    for (const frameID of frameIDs) {
      const frameElem = document.getElementById(frameID);
      if (frameElem) {
        // check if event e was performed "on" the element windowElem
        // which means basicaly check if the dragEnd happen on a frame.
        const windowRect = frameElem.getBoundingClientRect();
        // Check if the dragEnd event occurred within the bounds of the windowElem
        const withinBounds =
          e.clientX >= windowRect.left &&
          e.clientX <= windowRect.right &&
          e.clientY >= windowRect.top &&
          e.clientY <= windowRect.bottom;
        if (withinBounds) {
          if ($store.isInsideFrameID !== "" && $store.isInsideFrameID !== frameID) {
            // Window was inside a different frame and is now being moved to a new frame
            // console.log(
            //   "Transferring window from frame",
            //   $store.isInsideFrameID,
            //   "to frame",
            //   frameID
            // );
            $store.isInsideFrameID = frameID;
            // Additional logic here for updating GunDB or handling frame transfer
            user.get("windows").get(uniqueID).put({ isInsideFrameID: frameID });
          } else if ($store.isInsideFrameID === "") {
            // Window was not in any frame and is now being placed inside a frame
            // console.log("Placing window inside frame", frameID);
            $store.isInsideFrameID = frameID;
            // Additional logic here for updating GunDB or handling initial placement into a frame
            user.get("windows").get(uniqueID).put({ isInsideFrameID: frameID });
          }
        } else if (!withinBounds && $store.isInsideFrameID === frameID) {
          // Window was inside this frame but has now been moved out
          // console.log("Removing window from frame", frameID);
          $store.isInsideFrameID = "";
          // Additional logic here for updating GunDB or handling removal from a frame
          user.get("windows").get(uniqueID).put({ isInsideFrameID: "" });
        } else {
          // console.log("Window was not and is not in a frame");
        }
      }
    }
  }

  function handleDoubleClick(event) {
    dbclickFunc(store, event);
  }

  // sometimes we want to see if drag event has took place or not
  // below code was setting isDragging false exclusively after the click is finished and if isDragging was true
  // however we currently reverted that, now dragging functionality sets isDragging false.
  function handleClick(event) {
    if (isDragging) {
      // isDragging = false;
      // console.log("set dragging false");
      return;
    }
    if (resizing) {
      resizing = false;
      // console.log("set resizing false");
      return;
    }
    // console.log($contentProperties.selectedWindows);
    // isSelected = !isSelected;

    clickFunc(store, event);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  id={uniqueID}
  class="draggable resizable"
  class:box-shadow={$store.boxShadow}
  style="
  --grabber-size: {grabberSize}px;
  transform: scale({$store.scale}); 
  left: {$store.x}px; 
  top: {$store.y}px; 
  width: {$store.width}px;
  height: {$store.height}px;
  z-index: {$store.zIndex};
  outline: {$contentProperties.activeWindow === uniqueID ? '10px double green' : 'none'};"
  use:draggable
  use:resize
  use:scalability
  ondblclick={stopPropagation(handleDoubleClick)}
  onclick={stopPropagation(handleClick)}
>
  {#if children}{@render children()}{:else}No child Component provided{/if}
</div>

<style>
  .draggable {
    position: absolute;
    min-height: 80px;
    min-width: 80px;
    transform-origin: 0 0;
    touch-action: none; /*improve touch interactions*/
    user-select: none;
  }

  .box-shadow {
    box-shadow: 0px 2px 20px #000000;
  }

  :root {
    --blue: #5cadff;
    --darker-blue: #1e5791;
    --active-green: green;
  }

  /* Global grabber styles */
  :global(.grabber) {
    position: absolute;
    box-sizing: border-box;
    width: var(--grabber-size, 10px);
    height: var(--grabber-size, 10px);
    /* background-color: var(--blue); Example background color */
    transition:
      width 0.2s,
      height 0.2s; /* Smooth resizing */
  }

  /* Hover effect for grabbers */
  :global(.grabber:hover) {
    background-color: rgba(0, 0, 0, 0.5);
    transition:
      background-color 0.2s,
      width 0.2s,
      height 0.2s;
  }

  /* Specific grabber positions and cursors */
  :global(.grabber.right) {
    width: var(--grabber-size, 10px);
    height: 100%;
    right: calc(-0.5 * var(--grabber-size, 10px));
    cursor: col-resize;
    top: 0;
  }

  :global(.grabber.left) {
    width: var(--grabber-size, 10px);
    height: 100%;
    left: calc(-0.5 * var(--grabber-size, 10px));
    cursor: col-resize;
    top: 0;
  }

  :global(.grabber.top) {
    height: var(--grabber-size, 10px);
    width: 100%;
    top: calc(-0.5 * var(--grabber-size, 10px));
    cursor: row-resize;
  }

  :global(.grabber.bottom) {
    height: var(--grabber-size, 10px);
    width: 100%;
    bottom: calc(-0.5 * var(--grabber-size, 10px));
    cursor: row-resize;
  }

  /* Corner grabbers */
  :global(.grabber.top-left),
  :global(.grabber.top-right),
  :global(.grabber.bottom-left),
  :global(.grabber.bottom-right) {
    height: var(--grabber-size, 10px);
    width: var(--grabber-size, 10px);
    border-radius: 50%;
  }

  :global(.grabber.top-left) {
    top: calc(-0.5 * var(--grabber-size, 10px));
    left: calc(-0.5 * var(--grabber-size, 10px));
    cursor: nw-resize;
  }

  :global(.grabber.top-right) {
    top: calc(-0.5 * var(--grabber-size, 10px));
    right: calc(-0.5 * var(--grabber-size, 10px));
    cursor: ne-resize;
  }

  :global(.grabber.bottom-left) {
    bottom: calc(-0.5 * var(--grabber-size, 10px));
    left: calc(-0.5 * var(--grabber-size, 10px));
    cursor: sw-resize;
  }

  :global(.grabber.bottom-right) {
    bottom: calc(-0.5 * var(--grabber-size, 10px));
    right: calc(-0.5 * var(--grabber-size, 10px));
    cursor: se-resize;
  }

  /* Hover effect for corner grabbers */
  :global(.grabber.top-left:hover),
  :global(.grabber.top-right:hover),
  :global(.grabber.bottom-left:hover),
  :global(.grabber.bottom-right:hover) {
    height: calc(var(--grabber-size, 10px) * 2);
    width: calc(var(--grabber-size, 10px) * 2);
  }

  /* Hide grabber styles */
  :global(.hide-grabber) {
    background: transparent !important;
    border: none !important;
  }

  /* Selected grabber styles */
  :global(.grabber.selected) {
    border: solid 1px black;
  }
</style>
