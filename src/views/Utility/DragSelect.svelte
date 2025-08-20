<!--  Workscape.svelte -->
<script>
  import { get } from "svelte/store";
  import { onMount, onDestroy } from "svelte";
  import { contentProperties, isDraggingSelect, windowStores } from "../../scripts/storage.js";
  import { deactivateWindows } from "../../scripts/utils.js";

  let dragSelectDiv = $state();
  let dragSelectDivWidth = $state("");
  let dragSelectDivHeight = $state("");
  let dragSelectDivTop = $state("0px");
  let dragSelectDivLeft = $state("0px");

  function handleSelectMouseDown(event) {
    if (event.button === 0 && event.shiftKey) {
      deactivateWindows();
      createOrUpdateDragSelect(event);
      window.addEventListener("mouseup", handleSelectMouseUp);
      $isDraggingSelect = true;
    }
  }

  function handleSelectMouseUp() {
    window.removeEventListener("mouseup", handleSelectMouseUp);
    $isDraggingSelect = false;
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

  // helpers
  function selectWindow(windowData) {
    contentProperties.update((data) => {
      data.selectedWindows = [...data.selectedWindows, get(windowData).uniqueID];
      return data;
    });
    windowData.update((store) => {
      store.selected = true;
      return store;
    });
  }

  function unselectWindow(windowData, index) {
    contentProperties.update((data) => {
      data.selectedWindows.splice(index, 1);
      return data;
    });
    windowData.update((store) => {
      store.selected = false;
      return store;
    });
  }

  export function unselectAllWindows() {
    for (const windowData of Object.values(get(windowStores))) {
      windowData.update((store) => {
        store.selected = false;
        return store;
      });
    }
    contentProperties.update((data) => {
      data.selectedWindows = [];
      return data;
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

    for (const windowData of Object.values(get(windowStores))) {
      const id = get(windowData).uniqueID;
      const windowElem = document.getElementById(id);
      const index = $contentProperties.selectedWindows.indexOf(id);

      if (!windowElem) continue;

      const rect = windowElem.getBoundingClientRect();
      if (
        checkRectIntersection({ x: x + window.scrollX, y: y + window.scrollY, height, width }, rect)
      ) {
        selectWindow(windowData);
      } else if (index !== -1) {
        unselectWindow(windowData, index);
      }
      contentProperties.update((data) => {
        data.selectedWindows = [...new Set(data.selectedWindows)];
        return data;
      });
    }

    // first if a window is active, deactivate it
    if ($contentProperties.isAWindowActivated) {
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
      $isDraggingSelect = false;
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

<!-- <svelte:window
  onpointerdown={unselectAllWindows}
/> -->

{#if $isDraggingSelect}
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
