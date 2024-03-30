<!--  Workscape.svelte -->
<script>
  import { get } from "svelte/store";
  import { workspaceStore, windowsStore, windowPropertyStores } from "../../store.js";
  import { onMount, onDestroy } from "svelte";
  import { updateWindowStore } from "../../js/utils.js";

  let isDraggingSelect = false;
  let dragSelectDiv;
  let dragSelectDivWidth = 0;
  let dragSelectDivHeight = 0;
  let dragSelectDivTop = "0px";
  let dragSelectDivLeft = "0px";

  function handleSelectMouseDown(event) {
    if (event.button === 0 && event.shiftKey) {
      createOrUpdateDragSelect(event);
      window.addEventListener("mouseup", handleSelectMouseUp);
      isDraggingSelect = true;
    }
  }

  function handleSelectMouseUp() {
    window.removeEventListener("mouseup", handleSelectMouseUp);
    isDraggingSelect = false;
  }

  function createOrUpdateDragSelect(event) {
    event.preventDefault();
    const x = event.pageX;
    const y = event.pageY;

    dragSelectDivWidth = "0";
    dragSelectDivHeight = "0";
    dragSelectDivTop = x + "px";
    dragSelectDivLeft = y + "px";

    function resize(event) {
      const diffX = event.pageX - x;
      const diffY = event.pageY - y;
      dragSelectDivLeft = diffX < 0 ? x + diffX + "px" : x + "px";
      dragSelectDivTop = diffY < 0 ? y + diffY + "px" : y + "px";
      dragSelectDivHeight = Math.abs(diffY) + "px";
      dragSelectDivWidth = Math.abs(diffX) + "px";
      checkSelected(dragSelectDiv);
    }
    addEventListener("mousemove", resize);
    addEventListener("mouseup", () => {
      removeEventListener("mousemove", resize);
    });
  }

  function checkSelected(selectAreaElem) {
    let select;
    try {
      select = selectAreaElem.getBoundingClientRect();
    } catch (error) {
      return;
    }
    const { x, y, height, width } = select;

    const windows = $windowsStore || [];

    for (const windowData of windows) {
      const windowElem =
        document.getElementById(`app-${windowData.windowId}`) ||
        document.getElementById(`frame-${windowData.windowId}`);
      const index = $workspaceStore.selectedWindows.indexOf(windowData.windowId);
      if (windowElem) {
        const rect = windowElem.getBoundingClientRect();
        if (
          checkRectIntersection(
            { x: x + window.scrollX, y: y + window.scrollY, height, width },
            rect
          )
        ) {
          // If the window is within the selection, add to list
          $workspaceStore.selectedWindows = [
            ...$workspaceStore.selectedWindows,
            windowData.windowId,
          ];
        } else if (index != -1) {
          $workspaceStore.selectedWindows.splice(index, 1);
          $workspaceStore.selectedWindows = $workspaceStore.selectedWindows;
        }
      }
      $workspaceStore.selectedWindows = [...new Set($workspaceStore.selectedWindows)];
    }
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
  }

  function checkRectIntersection(r1, r2) {
    return !(
      r1.x + r1.width < r2.x ||
      r2.x + r2.width < r1.x ||
      r1.y + r1.height < r2.y ||
      r2.y + r2.height < r1.y
    );
  }

  function handleKeyPress(event) {
    if (event.shiftKey) {
      window.addEventListener("mousedown", handleSelectMouseDown);
      window.addEventListener("mouseup", handleSelectMouseUp);
    }
  }

  function handleKeyUp(event) {
    if (event.code == "ShiftLeft") {
      window.removeEventListener("mouseup", handleSelectMouseUp);
      window.removeEventListener("mousedown", handleSelectMouseDown);
      isDraggingSelect = false;
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("keyup", handleKeyUp);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleKeyPress);
    window.removeEventListener("keyup", handleKeyUp);
  });
</script>

{#if isDraggingSelect}
  <div
    bind:this={dragSelectDiv}
    class="drag-select"
    style="
      width:{dragSelectDivWidth};
      height:{dragSelectDivHeight};
      top:{dragSelectDivTop};
      left:{dragSelectDivLeft};
      "
  ></div>
{/if}

<style>
  .drag-select {
    position: absolute;
    background-color: rgba(20, 137, 189, 0.5);
    z-index: 11;
  }
</style>
