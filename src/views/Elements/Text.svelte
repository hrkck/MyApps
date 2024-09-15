<script>
  import RichTextEditor from "./RichTextEditor.svelte";
  import DraggableResizable from "../DraggableResizableScalableComponent/DraggableResizableScalable.svelte";
  import { contentProperties } from "../../scripts/storage";
  import { user } from "../../scripts/initGun";
  import { onMount } from "svelte";
  import { cleanGunData } from "../../scripts/utils";

  export let uniqueID;
  export let textStore;
  export let imageAppStore;
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
      store.update((data) => {
        data.contentScale = $imageAppStore.scale * $contentProperties.scale;
        return data;
      });
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

    content.blocks.forEach((block) => {
      if (block.id) {
        user
          .get("windows")
          .get(mainAppStoreUniqueID)
          .get("imageAppData")
          .get("texts")
          .get(uniqueID)
          .get("textStoreData")
          .get("blocks")
          .get(block.id)
          .put(block, (ack) => {
            if (ack.err) {
              console.error("Error saving block to GunDB:", ack.err);
            } else {
              console.log(`Successfully saved block ${block.id} to GunDB:`, block);
              if (block.data?.file?.url) {
                console.log("Saving image block.");
                // Here we should make sure that 'file' and its URL are properly saved
                if (block.data.file.url) {
                  user
                    .get("windows")
                    .get(mainAppStoreUniqueID)
                    .get("imageAppData")
                    .get("texts")
                    .get(uniqueID)
                    .get("textStoreData")
                    .get("blocks")
                    .get(block.id)
                    .get("data")
                    .get("url") // for some reason I cannot save in normal editorjs format which is data.file.url, instead i save it in data.url then it works.
                    .put(block.data.file.url, (ack) => {
                      if (ack.err) {
                        console.error("Error saving file data:", ack.err);
                      } else {
                        console.log("Successfully saved file data.");
                        console.log(block.data.file.url);
                      }
                    });
                }
              }
            }
          });
      } else {
        console.warn("Skipping block with no ID:", block);
      }
    });
  }

  function updateIsCursorInsideEditor(event) {
    const isCursorInsideEditor = event.detail;
    $imageAppStore.isCursorInsideEditor = isCursorInsideEditor;
  }

  onMount(async () => {
    try {
      const blocks = await fetchBlocks();
      if (blocks) {
        textStore.update((store) => ({
          ...store,
          blocks: blocks,
        }));
      }
    } catch (error) {
      console.error("Error fetching blocks:", error);
    }
  });

  async function fetchBlocks() {
    const path = [
      "windows",
      mainAppStoreUniqueID,
      "imageAppData",
      "texts",
      uniqueID,
      "textStoreData",
      "blocks",
    ];
    const data = await fetchData(path);
    if (!data) throw new Error(`No data found for blocks`);

    const blockPromises = Object.keys(data)
      .filter((blockId) => blockId !== "_")
      .map((blockId) => fetchBlockWithInnerData(blockId));

    return Promise.all(blockPromises);
  }

  async function fetchBlockWithInnerData(blockId) {
    const blockPath = [
      "windows",
      mainAppStoreUniqueID,
      "imageAppData",
      "texts",
      uniqueID,
      "textStoreData",
      "blocks",
      blockId,
    ];
    const block = await fetchData(blockPath);
    if (!block) throw new Error(`No block found for blocks/${blockId}`);

    const dataPath = [...blockPath, "data"];
    block.data = await fetchData(dataPath);

    return cleanGunData(block);
  }

  async function fetchData(path) {
    return new Promise((resolve, reject) => {
      user
        .get(path[0])
        .get(path[1])
        .get(path[2])
        .get(path[3])
        .get(path[4])
        .get(path[5])
        .get(path[6])
        .get(path[7])
        .once((data) => {
          resolve(cleanGunData(data || {}));
        });
    });
  }
</script>

<DraggableResizable {uniqueID} store={textStore} {...imageAppItemDraggableFunctions}>
  <div class="text-container">
    <RichTextEditor
      {textStore}
      on:isCursorInsideEditor={updateIsCursorInsideEditor}
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
