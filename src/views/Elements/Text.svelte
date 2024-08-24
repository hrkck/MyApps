<script>
  import RichTextEditor from "./RichTextEditor.svelte";
  import DraggableResizable from "../DraggableResizable.svelte";
  import { contentProperties } from "../../scripts/storage";
  import { user } from "../../scripts/initGun";
  import { get, writable } from "svelte/store";
  import { onMount } from "svelte";
  import { cleanGunData } from "../../scripts/utils";

  export let uniqueID;
  export let textStore;
  export let imageAppStore;
  let imageAppUniqueID = $imageAppStore.uniqueID;
  let mainAppStoreUniqueID = $imageAppStore.mainAppStoreID;

  const imageAppItemDraggableFunctions = {
    dragStartFunc: function (store, event, x, y) {
      store.update((data) => {
        data.contentScale = $imageAppStore.scale * $contentProperties.scale;
        return data;
      });
      // console.log($imageAppStore.scale , $contentProperties.scale);
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
        // console.log(x,y);
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
        // console.log(store, event, x, y, width, height);
    },
    scaleFunc: function (store, event, x, y, scale) {
      store.update((data) => {
        data.contentScale = $imageAppStore.scale * $contentProperties.scale;
        return data;
      });
      // console.log($imageAppStore.scale, $contentProperties.scale);
    },
  };

  onMount(async () => {
    const blocks = await fetchBlocksData("texts", uniqueID);
    if (blocks) {
      // console.log("Setting blocks Data:");
      // console.log(blocks);
      textStore.update((store) => {
        return { ...store, blocks: blocks };
      }); // Set the entire content object
      // console.log(get(textStore));
      // console.log(
        // get(textStore) && get(textStore).blocks && get(textStore).blocks.length
          // ? get(textStore).blocks
          // : "No blocks found",
      // );
    }
  });

  async function fetchBlocksData(dataType, key) {
    return new Promise((resolve, reject) => {
      user
        .get("windows")
        .get(mainAppStoreUniqueID)
        .get("imageAppData")
        .get(dataType)
        .get(key)
        .get("textStoreData")
        .get("blocks")
        .once((data) => {
          if (data) {
            const blockPromises = Object.keys(data)
              .filter((blockId) => blockId !== "_") // Skip blocks with ID '_'
              .map((blockId) => {
                // console.log("blockID: ", blockId);
                return fetchBlockData(dataType, key, blockId);
              });

            Promise.all(blockPromises)
              .then((blocks) => {
                resolve(blocks.map(cleanGunData));
              })
              .catch((error) => {
                reject(error);
              });
          } else {
            reject(new Error(`No data found for ${dataType}/${key}/textStoreData/blocks`));
          }
        });
    });
  }

  async function fetchBlockData(dataType, key, blockId) {
    return new Promise((resolve, reject) => {
      user
        .get("windows")
        .get(mainAppStoreUniqueID)
        .get("imageAppData")
        .get(dataType)
        .get(key)
        .get("textStoreData")
        .get("blocks")
        .get(blockId)
        .once(async (block) => {
          if (block) {
            // Fetch the actual data for the block
            const data = await fetchBlockInnerData(dataType, key, blockId, "data");
            block.data = data;
            resolve(cleanGunData(block));
          } else {
            reject(
              new Error(`No block found for ${dataType}/${key}/textStoreData/blocks/${blockId}`),
            );
          }
        });
    });
  }

  async function fetchBlockInnerData(dataType, key, blockId, innerKey) {
    return new Promise((resolve, reject) => {
      user
        .get("windows")
        .get(mainAppStoreUniqueID)
        .get("imageAppData")
        .get(dataType)
        .get(key)
        .get("textStoreData")
        .get("blocks")
        .get(blockId)
        .get(innerKey)
        .once((data) => {
          if (data) {
            resolve(cleanGunData(data));
          } else {
            reject(
              new Error(
                `No data found for ${dataType}/${key}/textStoreData/blocks/${blockId}/${innerKey}`,
              ),
            );
          }
        });
    });
  }
</script>

<DraggableResizable {uniqueID} store={textStore} {...imageAppItemDraggableFunctions}>
  <div class="text-container">
    <RichTextEditor {textStore} {uniqueID} {mainAppStoreUniqueID} />
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
