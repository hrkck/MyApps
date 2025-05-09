<script>
  import RichTextEditor from "./RichTextEditor.svelte";
  import DraggableResizable from "../DraggableResizableScalableComponent/DraggableResizableScalable.svelte";
  import { contentProperties } from "../../scripts/storage";
  import { user } from "../../scripts/initGun";
  import { onMount } from "svelte";
  import { flattenEditorJSData } from "../../scripts/utils";

  let { uniqueID, textStore, imageAppStore } = $props();
  let mainAppStoreUniqueID = $imageAppStore.mainAppStoreID;

  const imageAppItemDraggableFunctions = {
    dragStartFunc: function (store, event, x, y) {
      store.update((data) => {
        data.contentScale = $imageAppStore.scale * $contentProperties.scale;
        return data;
      });
    },
    dragEndFunc: function (store, event, x, y) {
      user
        .get("windows")
        .get(mainAppStoreUniqueID)
        .get("imageAppData")
        .get("texts")
        .get(uniqueID)
        .get("textStoreData")
        .put({ x: x, y: y });
    },
    resizeStartFunc: function (store, event, x, y, width, height) {
      store.update((data) => {
        data.contentScale = $imageAppStore.scale * $contentProperties.scale;
        return data;
      });
    },
    resizeEndFunc: function (store, event, x, y, width, height) {
      user
        .get("windows")
        .get(mainAppStoreUniqueID)
        .get("imageAppData")
        .get("texts")
        .get(uniqueID)
        .get("textStoreData")
        .put({ x: x, y: y, width: width, height: height });
    },
    scaleFunc: function (store, event, x, y, scale) {
      // store.update((data) => {
      //   data.contentScale = $imageAppStore.scale * $contentProperties.scale;
      //   return data;
      // });
    },
  };

  function handleContentChanged(event) {
    const content = event.detail;
    saveToGunDB(content);
  }

  function saveToGunDB(content) {
    if (!content || !Array.isArray(content.blocks)) {
      console.error("Invalid content or blocks data provided.");
      return;
    }

    content.blocks.forEach((block, index) => {
      if (block.id) {
        block.order = index;
        block.textStoreID = uniqueID
        user
          .get("windows")
          .get(mainAppStoreUniqueID)
          .get("imageAppData")
          .get("texts")
          .get(uniqueID)
          .get('textStoreData')
          .get("blocks")
          .get(block.order)
          .put(flattenEditorJSData(block), (ack) => {
            if (ack.err) {
              console.error("Error saving block to GunDB:", ack.err);
            } else {
              // console.log(`Successfully saved block ${block.id} to GunDB:`, block);
            }
          });
      } else {
        console.warn("Skipping block with no ID:", block);
      }
    });
  }
  
  function fin(event){
    $textStore.isCursorInsideEditor = true;
  }
  function fout(event){
    $textStore.isCursorInsideEditor = false;
  }


  onMount(async () => {
  });

</script>

<DraggableResizable {uniqueID} store={textStore} {...imageAppItemDraggableFunctions}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <div class="text-container" onmouseenter={fin} onmouseleave={fout}>
    <RichTextEditor
      {textStore}
      on:contentChanged={handleContentChanged}
    />
  </div>
</DraggableResizable>

<style>
  .text-container {
    background-color: rgba(0, 0, 0, 0.1); /* Transparent gray */
    width: 100%;
    height: 100%;
    overflow: scroll;
  }
</style>
