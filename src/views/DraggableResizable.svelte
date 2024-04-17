<!--  DraggabkeResizable.svelte -->
<script>
  import { user } from "../scripts/gun";
  import { contentProperties, windowStores } from "../scripts/storage";

  export let dragStartFunc = function (store, event, x, y) {};
  export let dragMoveFunc = function (store, event, x, y) {};
  export let dragEndFunc = function (store, event, x, y) {};
  export let resizeStartFunc = function (store, event, x, y, width, height) {};
  export let resizeMoveFunc = function (store, event, x, y, width, height) {};
  export let resizeEndFunc = function (store, event, x, y, width, height) {};
  export let scaleFunc = function (store, event, x, y, scale) {};
  export let clickFunc = function (store, event) {};
  export let dbclickFunc = function (store, event) {};

  export let uniqueID = "no-unique-id";
  export let store;

  // Draggable
  let isDragging = false;
  function draggable(node) {
    let lastTouchX, lastTouchY; // Track the last touch positions

    function onMove(event) {
      if (resizing) return;
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
      dragMoveFunc(store, event, dx / $store.contentScale, dy / $store.contentScale);
    }

    function onStart(event) {
      if (event.button != 0 || ($contentProperties.isAWindowActive && !$store.isActiveDraggable))
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
      lastTouchX = undefined;
      lastTouchY = undefined;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);

      dragEndFunc(store, event, $store.x, $store.y);
    }

    let target;
    switch ($store.dragEventTarget) {
      case "window":
        target = window;
        break;
      case "node":
        target = node;
        break;
      default:
        target = document.getElementById($store.dragEventTarget);
        break;
    }

    target.addEventListener("mousedown", onStart);
    target.addEventListener("touchstart", onStart, {
      passive: false,
    });

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
    };

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

    function onMove(event) {
      if (!active || ($contentProperties.isAWindowActive && !$store.isActiveDraggable)) return;

      const direction = active.direction;
      let delta;

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
    }

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
  function scalability(element) {
    if (!$store.scalable) return;

    if ($store.useWindow) {
      window.addEventListener("wheel", changeScale, { passive: false });
    } else {
      element.addEventListener("wheel", changeScale);
    }

    let target;
    switch ($store.dragEventTarget) {
      case "window":
        window.addEventListener("wheel", changeScale, { passive: false });
        break;
      default:
        target = target = document.getElementById($store.dragEventTarget);
        target.addEventListener("wheel", changeScale);
        break;
    }

    function changeScale(event) {
      if ($contentProperties.isAWindowActive && !$store.isActiveDraggable) return;
      event.preventDefault();

      // Get mouse offset relative to the parent of the scalable area
      const rect = element.parentElement.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Normalize mouse wheel to +1 or -1
      const wheel = event.deltaY < 0 ? 1 : -1;

      // Compute zoom factor
      const zoom = Math.exp(wheel * scaleStep);

      // Compute the new scale
      let newScale = $store.scale * zoom;

      // Ensure the scale doesn't get too small or too large
      if (newScale > 0.05 && newScale < 7) {
        // Adjust contentX and contentY to keep the mouse point constant
        // The formula here is a bit different from Stack overflow answer!
        // We first take the delta of content to the mouse position multiplied by the ratio of scales,
        // then add the mouse position to the content. This value is then _assigned_ (not incremented) to the new value of the content (for X and Y)
        $store.x =
          ($store.x - mouseX / $store.contentScale) * (newScale / $store.scale) +
          mouseX / $store.contentScale;
        $store.y =
          ($store.y - mouseY / $store.contentScale) * (newScale / $store.scale) +
          mouseY / $store.contentScale;

        // Apply the new scale
        $store.scale = newScale;
        scaleFunc(store, event, $store.x, $store.y, $store.scale);
      }
    }

    return {
      destroy() {
        window.removeEventListener("wheel", changeScale);
        element.removeEventListener("wheel", changeScale);
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
            console.log(
              "Transferring window from frame",
              $store.isInsideFrameID,
              "to frame",
              frameID
            );
            $store.isInsideFrameID = frameID;
            // Additional logic here for updating GunDB or handling frame transfer
            user.get("windows").get(uniqueID).put({ isInsideFrameID: frameID });
          } else if ($store.isInsideFrameID === "") {
            // Window was not in any frame and is now being placed inside a frame
            console.log("Placing window inside frame", frameID);
            $store.isInsideFrameID = frameID;
            // Additional logic here for updating GunDB or handling initial placement into a frame
            user.get("windows").get(uniqueID).put({ isInsideFrameID: frameID });
          }
        } else if (!withinBounds && $store.isInsideFrameID === frameID) {
          // Window was inside this frame but has now been moved out
          console.log("Removing window from frame", frameID);
          $store.isInsideFrameID = "";
          // Additional logic here for updating GunDB or handling removal from a frame
          user.get("windows").get(uniqueID).put({ isInsideFrameID: "" });
        } else {
          console.log("Window was not and is not in a frame");
        }
      }
    }
  }

  function handleDoubleClick(event) {
    dbclickFunc(store, event);
  }
  function handleClick(event) {
    if (isDragging) {
      isDragging = false;
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

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  id={uniqueID}
  class="draggable resizable"
  class:box-shadow={$store.boxShadow}
  style="
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
  on:dblclick|stopPropagation={handleDoubleClick}
  on:click|stopPropagation={handleClick}
>
  <slot>No child Component provided</slot>
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
    box-shadow: 5px 10px 8px #252525;
  }

  :root {
    --blue: #5cadff;
    --darker-blue: #1e5791;
    --active-green: green;
  }

  :global(.grabber) {
    position: absolute;
    box-sizing: border-box;
  }

  :global(.grabber.right) {
    width: 5px;
    height: 100%;
    background: var(--blue);
    right: -5px;
    cursor: col-resize;
    top: 0;
  }

  :global(.grabber.left) {
    width: 5px;
    height: 100%;
    background: var(--blue);
    left: -5px;
    cursor: col-resize;
    top: 0;
  }

  :global(.grabber.top) {
    height: 5px;
    width: 100%;
    background: var(--blue);
    top: -5px;
    cursor: row-resize;
  }

  :global(.grabber.bottom) {
    height: 5px;
    width: 100%;
    background: var(--blue);
    bottom: -5px;
    cursor: row-resize;
  }

  :global(.grabber.top-left) {
    height: 10px;
    width: 10px;
    background: var(--darker-blue);
    top: -5px;
    left: -5px;
    cursor: nw-resize;
    border-radius: 100%;
  }

  :global(.grabber.top-right) {
    height: 10px;
    width: 10px;
    background: var(--darker-blue);
    top: -5px;
    right: -5px;
    cursor: ne-resize;
    border-radius: 100%;
  }

  :global(.grabber.bottom-left) {
    height: 10px;
    width: 10px;
    background: var(--darker-blue);
    bottom: -5px;
    left: -5px;
    cursor: sw-resize;
    border-radius: 100%;
  }

  :global(.grabber.bottom-right) {
    height: 10px;
    width: 10px;
    background: var(--darker-blue);
    bottom: -5px;
    right: -5px;
    cursor: se-resize;
    border-radius: 100%;
  }

  :global(.hide-grabber) {
    background: transparent !important;
    border: none !important;
  }

  :global(.grabber.selected) {
    border: solid 1px black;
  }
</style>
