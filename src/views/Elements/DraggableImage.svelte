<script>
  import { user } from "../../scripts/initGun";
  import { contentProperties } from "../../scripts/storage";
  import DraggableResizable from "../DraggableResizableScalableComponent/DraggableResizableScalable.svelte";

  let { imageUrl, uniqueID, imageStore, imageAppStore, imageAppContainer } = $props();
  let imageAppUniqueID = $imageAppStore.mainAppStoreID;

  const imageAppItemDraggableFunctions = {
    dragStartFunc: function (store, event, x, y) {
      store.update((data) => {
        data.contentScale = $imageAppStore.scale * $contentProperties.scale;
        return data;
      });
    },
    dragEndFunc: async function (store, event, x, y) {
      user
        .get("windows")
        .get(imageAppUniqueID)
        .get("imageAppData")
        .get("images")
        .get(uniqueID)
        .get("imageStoreData")
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
        .get(imageAppUniqueID)
        .get("imageAppData")
        .get("images")
        .get(uniqueID)
        .get("imageStoreData")
        .put({ x: x, y: y, width: width, height: height });
      // console.log(x,y,height,width);
    },
    scaleFunc: function (store, event, x, y, scale) {
      // store.update((data) => {
      //   data.contentScale = $imageAppStore.scale * $contentProperties.scale;
      //   return data;
      // });
    },
  };
</script>

<DraggableResizable {uniqueID} store={imageStore} mainAppStore={imageAppStore} {...imageAppItemDraggableFunctions} mainAppContainer={imageAppContainer}>
  <img
    class="image-resize"
    src={imageUrl}
    alt="File from Clipboard"
    style="user-select: none; pointer-events:none;"
  />
</DraggableResizable>

<style>
  .image-resize {
    width: 100%;
    height: 100%;
    user-select: none;
    pointer-events: none;
  }
</style>
