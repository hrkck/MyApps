<!--  DraggabkeResizable.svelte -->
<script>
  import { user } from "../scripts/initGun";
  import { contentProperties, contextMenu, windowStores } from "../scripts/storage";

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
      // console.log(dx / $store.contentScale || 0, dy / $store.contentScale || 0);
      dragMoveFunc(store, event, dx / $store.contentScale || 0, dy / $store.contentScale || 0);
    }

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

      // console.log($store.x, $store.y);
      dragStartFunc(store, event, $store.x, $store.y);
    }

    function onEnd(event) {
      isDragging = false;
      lastTouchX = undefined;
      lastTouchY = undefined;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);

      // console.log($store.x, $store.y);
      dragEndFunc(store, event, $store.x, $store.y);
    }

    let target;
    // console.log($store);
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

    function onMove(event) {
      if (!active || ($contentProperties.isAWindowActive && !$store.isActiveDraggable)) return;

      const direction = active.direction;
      let delta;

      if (initialRect == undefined && initialPos == undefined) {
        console.log('undefined behavior, not resizing.');
        return ;
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
  function scalability(node) {
    if (!$store.scalable) return;

    let initialDistance = 0;
    let isScaling = false;

    function changeScale(event, zoom) {
      if ($contentProperties.isAWindowActive && !$store.isActiveDraggable) {
        return;
      }

      // console.log('trying to scale');

      const rect = node.parentElement.getBoundingClientRect();
      const mouseX = initialDistance != 0 ? 1 : event.clientX - rect.left;
      const mouseY = initialDistance != 0 ? 1 : event.clientY - rect.top;
      let newScale = $store.scale * zoom;

      // console.log(rect, mouseX, mouseY,  $store.scale, newScale);
      if (newScale > 0.05 && newScale < 7) {
        $store.x =
          ($store.x - mouseX / $store.contentScale) * (newScale / $store.scale) +
          mouseX / $store.contentScale;
        $store.y =
          ($store.y - mouseY / $store.contentScale) * (newScale / $store.scale) +
          mouseY / $store.contentScale;
        $store.scale = newScale;
      }
      if($store.scale == undefined) {
          // console.log('resetting scale to 1:');
          $store.scale = 1;
        }
      scaleFunc(store, event, $store.x, $store.y, $store.scale);
    }

    function onMouseWheel(event) {
      if (isScaling || isDragging || resizing) return;
      event.preventDefault();
      const wheel = event.deltaY < 0 ? 1 : -1;
      const zoom = Math.exp(wheel * scaleStep);
      changeScale(event, zoom);
    }

    function onTouchStart(event) {
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      }
    }

    function onTouchMove(event) {
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
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

    if ($store.useWindow) {
      window.addEventListener("wheel", onMouseWheel, { passive: false });
    } else {
      node.addEventListener("wheel", onMouseWheel);
      node.addEventListener("mousedown", handleDragStart);
      window.addEventListener("mouseup", handleDragEnd);
    }

    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    // Adding wheel event listener to the target element
    let target;
    switch ($store.dragEventTarget) {
      case "window":
        window.addEventListener("wheel", onMouseWheel, { passive: false });
        break;
      default:
        target = document.getElementById($store.dragEventTarget);
        target.addEventListener("wheel", onMouseWheel);
        break;
    }

    return {
      destroy() {
        if ($store.useWindow) {
          window.removeEventListener("wheel", onMouseWheel);
        } else {
          node.removeEventListener("wheel", onMouseWheel);
          node.removeEventListener("mousedown", handleDragStart);
          window.removeEventListener("mouseup", handleDragEnd);
        }
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
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
    box-shadow: 0px 2px 20px #000000;
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
    width: 10px;
    height: 100%;
    right: -5px;
    cursor: col-resize;
    top: 0;
  }

  :global(.grabber.left) {
    width: 10px;
    height: 100%;
    left: -5px;
    cursor: col-resize;
    top: 0;
  }

  :global(.grabber.top) {
    height: 10px;
    width: 100%;
    top: -5px;
    cursor: row-resize;
  }

  :global(.grabber.bottom) {
    height: 10px;
    width: 100%;
    bottom: -5px;
    cursor: row-resize;
  }

  :global(.grabber.top-left) {
    height: 10px;
    width: 10px;
    top: -5px;
    left: -5px;
    cursor: nw-resize;
    border-radius: 100%;
  }

  :global(.grabber.top-right) {
    height: 10px;
    width: 10px;
    top: -5px;
    right: -5px;
    cursor: ne-resize;
    border-radius: 100%;
  }

  :global(.grabber.bottom-left) {
    height: 10px;
    width: 10px;
    bottom: -5px;
    left: -5px;
    cursor: sw-resize;
    border-radius: 100%;
  }

  :global(.grabber.bottom-right) {
    height: 10px;
    width: 10px;
    bottom: -5px;
    right: -5px;
    cursor: se-resize;
    border-radius: 100%;
  }

  :global(.grabber.top-left:hover),
  :global(.grabber.top-right:hover),
  :global(.grabber.bottom-left:hover),
  :global(.grabber.bottom-right:hover) {
    height: 20px;
    width: 20px;
  }

  :global(.hide-grabber) {
    background: transparent !important;
    border: none !important;
  }

  :global(.grabber.selected) {
    border: solid 1px black;
  }
</style>
