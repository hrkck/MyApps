<script>
  import RichTextEditor from "./RichTextEditor.svelte";
  import DraggableResizable from "../DraggableResizable.svelte";
  import { contentProperties } from "../../scripts/storage";
  import { user } from "../../scripts/initGun";

  export let uniqueID;
  export let textStore;
  export let imageAppStore;
  let imageAppUniqueID = $imageAppStore.uniqueID;

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
        .get(imageAppUniqueID)
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
        .get(imageAppUniqueID)
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
</script>

<DraggableResizable {uniqueID} store={textStore} {...imageAppItemDraggableFunctions}>
  <div class="text-container">
    <RichTextEditor {textStore} {uniqueID} />
  </div>
</DraggableResizable>

<style>
  .text-container {
    background-color: rgba(0, 0, 0, 0.1); /* Transparent gray */
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden; /* Prevent text from overflowing the container */
  }
</style>
