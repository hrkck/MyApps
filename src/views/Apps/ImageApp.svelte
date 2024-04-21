<script>
  import { get, writable } from "svelte/store";
  import { contentProperties, windowStores } from "../../scripts/storage";
  import { nowStr } from "../../scripts/utils";
  import DraggableResizable from "../DraggableResizable.svelte";
  import Background from "../Background.svelte";
  import { user } from "../../scripts/gun";
  import { onMount } from "svelte";

  // @ts-nocheck

  export let uniqueID;

  // @ts-ignore
  const mainAppStore = windowStores[uniqueID];
  let images = [];
  let texts = [];

  // bind with gundb init
  const imageAppStore = writable({
    uniqueID: "image-app-content-" + uniqueID,
    hideOverflow: false,
    dragEventTarget: "mainDiv-image-app-content-" + uniqueID,
    boxShadow: false,
    useWindow: false,
    scalable: true,
    resizable: false,
    showGrabbers: false,
    hideHeaderResize: true,
    x: 0,
    y: 0,
    width: 320,
    height: 240,
    contentScale: 1,
    scale: 1,
    zIndex: 2,
    isActiveDraggable: $mainAppStore.isActive,
    imageAppBackgroundX: 0,
    imageAppBackgroundY: 0,
    imageAppBackgroundScale: 1,
    backgroundColor: "rgb(214, 255, 185)",
  });
  // @ts-ignore

  // BUGGY CODE BELOW FIX
  $: {
    // make each image also active when main app is active
    $imageAppStore.isActiveDraggable = $mainAppStore.isActive;
    images.forEach((imgObj) => {
      let { imageUrl, key, imageStore } = imgObj;
      imageStore.update((data) => {
        data.isActiveDraggable = $mainAppStore.isActive;
        return data;
      });
    });
    texts.forEach((imgObj) => {
      let { key, textStore } = imgObj;
      textStore.update((data) => {
        data.isActiveDraggable = $mainAppStore.isActive;
        return data;
      });
    });
  }

  onMount(async () => {
    initializeAppData();
  });

  async function fetchStoreData(dataType, key, storeProperty) {
    return new Promise((resolve, reject) => {
      user
        .get("windows")
        .get(uniqueID)
        .get("imageAppData")
        .get(dataType)
        .get(key)
        .get(storeProperty)
        .once((data) => {
          if (data) {
            resolve(data);
          } else {
            reject(new Error(`No data found for ${dataType}/${key}/${storeProperty}`));
          }
        });
    });
  }

  async function initializeAppData() {
    user
      .get("windows")
      .get(uniqueID)
      .get("workspaceData")
      .once((data) => {
        if (data) {
          // console.log(data);
          $imageAppStore.x = data.x;
          $imageAppStore.y = data.y;
          $imageAppStore.scale = data.scale;
          $imageAppStore.contentScale = $contentProperties.scale;
        }
      });

    // Fetch and initialize data from GunDB
    // Initialize images from GunDB
    user
      .get("windows")
      .get(uniqueID)
      .get("imageAppData")
      .get("images")
      .map()
      .once(async (data, key) => {
        if (data && data.imageUrl) {
          if (images.some((img) => img.key === key)) return;
          try {
            const imageStoreData = await fetchStoreData("images", key, "imageStoreData");
            const imageStore = writable({
              ...imageStoreData,
              imageUrl: data.imageUrl,
              _: "cleared-gundb-output",
            });
            images = [...images, { imageUrl: data.imageUrl, key, imageStore }];
          } catch (error) {
            console.error(error);
          }
        }
      });

    // Initialize texts from GunDB
    user
      .get("windows")
      .get(uniqueID)
      .get("imageAppData")
      .get("texts")
      .map()
      .once(async (data, key) => {
        if (data && data.text) {
          if (texts.some((t) => t.key === key)) {
            console.log(texts);
            return;
          }
          try {
            const textStoreData = await fetchStoreData("texts", key, "textStoreData");
            console.log(textStoreData);
            const textStore = writable({
              ...textStoreData,
              text: data.text,
              _: "cleared-gundb-output",
            });
            texts = [...texts, { key, textStore }];
          } catch (error) {
            console.error(error);
          }
        }
      });
  }

  const draggableFunctions = {
    dragStartFunc: function (store, event, x, y) {
      console.log("drag starting , ", $mainAppStore.isActive);
      store.update((data) => {
        data.contentScale = $contentProperties.scale;
        return data;
      });
    },
    // @ts-ignore
    dragMoveFunc: function (store, event, x, y) {},
    // @ts-ignore
    dragEndFunc: function (store, event, x, y) {
      user.get("windows").get(uniqueID).get("workspaceData").put({ x: x, y: y });
    },
    resizeMoveFunc: function (store, event, x, y, width, height) {},
    // @ts-ignore
    resizeStartFunc: function (store, event, x, y, width, height) {},
    // @ts-ignore
    resizeEndFunc: function (store, event, x, y, width, height) {},
    scaleFunc: function (store, event, x, y, scale) {
      store.update((data) => {
        data.contentScale = $contentProperties.scale;
        return data;
      });
      user.get("windows").get(uniqueID).get("workspaceData").put({ x: x, y: y, scale: scale });
    },
    // @ts-ignore
    clickFunc: function (store, event) {},
    // @ts-ignore
    dbclickFunc: function (store, event) {},
  };

  const imageAppItemDraggableFunctions = {
    dragStartFunc: function (store, event, x, y) {
      store.update((data) => {
        data.contentScale = $imageAppStore.scale * $contentProperties.scale;
        return data;
      });
    },
    dragEndFunc: function (store, event, x, y) {
      const itemID = get(store).uniqueID;
      const itemType = itemID.split("-")[1] === "text" ? "texts" : "images";
      const storeType = itemType === "texts" ? "textStoreData" : "imageStoreData";
      user
        .get("windows")
        .get(uniqueID)
        .get("imageAppData")
        .get(itemType)
        .get(itemID)
        .get(storeType)
        .put({ x: x, y: y });
    },
    resizeStartFunc: function (store, event, x, y, width, height) {
      store.update((data) => {
        data.contentScale = $imageAppStore.scale * $contentProperties.scale;
        return data;
      });
    },
    resizeEndFunc: function (store, event, x, y, width, height) {
      const itemID = get(store).uniqueID;
      const itemType = itemID.split("-")[1] === "text" ? "texts" : "images";
      const storeType = itemType === "texts" ? "textStoreData" : "imageStoreData";
      user
        .get("windows")
        .get(uniqueID)
        .get("imageAppData")
        .get(itemType)
        .get(itemID)
        .get(storeType)
        .put({ x: x, y: y, width: width, height: height });
    },
    scaleFunc: function (store, event, x, y, scale) {
      store.update((data) => {
        data.contentScale = $imageAppStore.scale * $contentProperties.scale;
        return data;
      });
    },
  };

  const itemProperties = {
    // item = image or text
    hideOverflow: false,
    dragEventTarget: "node",
    useWindow: false,
    scalable: false,
    resizable: true,
    showGrabbers: true,
    hideHeaderResize: false,
    x: 0,
    y: 0,
    contentScale: 1,
    scale: 1,
    zIndex: 2,
    isActiveDraggable: $mainAppStore.isActive,
    imageAppBackgroundX: 0,
    imageAppBackgroundY: 0,
    imageAppBackgroundScale: 1,
  };

  // Function to handle pasted images
  function handleImagePaste(imageUrl) {
    const imageObj = new Image();
    imageObj.onload = function () {
      const key = `ref-img-${nowStr()}`;
      const imageStore = writable({
        uniqueID: key,
        boxShadow: false,
        keepRatio: true,
        width: this.naturalWidth,
        height: this.naturalHeight,
        ...itemProperties,
      });

      images = [...images, { imageUrl, key, imageStore }];
      // Save image data to GunDB
      let imageStoreData = get(imageStore);
      user
        .get("windows")
        .get(uniqueID)
        .get("imageAppData")
        .get("images")
        .get(key)
        .put({ imageUrl: imageUrl, imageStoreData: imageStoreData });
    };
    imageObj.src = imageUrl;
  }

  // Function to handle pasted text
  function handleTextPaste(text) {
    const key = `ref-text-${nowStr()}`;
    if (texts.some((t) => t.key === key)) return;
    const textStore = writable({
      text: text,
      uniqueID: key,
      boxShadow: true,
      keepRatio: false,
      width: 200,
      height: 200,
      ...itemProperties,
    });

    texts = [...texts, { key, textStore }];
    // Save text data to GunDB
    let textStoreData = get(textStore);
    user
      .get("windows")
      .get(uniqueID)
      .get("imageAppData")
      .get("texts")
      .get(key)
      .put({ text, textStoreData });
  }

  // handlePaste function to support both images and text
  function handlePaste(event) {
    const items = event.clipboardData.items;

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (item.kind === "file" && item.type.includes("image")) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => handleImagePaste(e.target.result);
        reader.readAsDataURL(blob);
      } else if (item.kind === "string" && item.type === "text/plain") {
        item.getAsString((text) => handleTextPaste(text));
      }
    }
  }

  function clearImages(event) {
    console.log("clear images", event);
  }
</script>

<!-- main div should listen to -->
<!-- paste event (ctrl+v) when mouse is over it and when the active window id equals uniqueid -->
<!--  -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  id={"mainDiv-" + $imageAppStore.uniqueID}
  class="main-image-app"
  on:mouseenter={() => self.addEventListener("paste", handlePaste)}
  on:mouseleave={() => self.removeEventListener("paste", handlePaste)}
>
  <button on:click={clearImages}>Delete All Text and Images</button>

  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="draggable-area">
    <DraggableResizable
      uniqueID={$imageAppStore.uniqueID}
      store={imageAppStore}
      {...draggableFunctions}
    >
      <!-- image handling -->
      {#each images as { imageUrl, key, imageStore } (key)}
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <DraggableResizable uniqueID={key} store={imageStore} {...imageAppItemDraggableFunctions}>
          <!-- add a frame like window draggable resizable -->
          <!-- must simply contain the images  -->
          <!-- a good use case to see good decoupling logic -->
          <!-- in checkBoundaries - like functions -->
          <img
            class="image-resize"
            src={imageUrl}
            alt="File from Clipboard"
            style="user-select: none; pointer-events:none;"
          />
        </DraggableResizable>
      {/each}

      <!-- Text handling -->
      {#each texts as { key, textStore } (key)}
        <DraggableResizable uniqueID={key} store={textStore} {...imageAppItemDraggableFunctions}>
          <div class="text-container">
            <p class="centered-text">
              {get(textStore).text}
            </p>
          </div>
        </DraggableResizable>
      {/each}
    </DraggableResizable>
    <Background store={imageAppStore} />
  </div>
</div>

<style>
  .main-image-app {
    position: absolute;

    width: 100%;
    height: 100%;
  }
  .draggable-area {
    position: absolute;

    height: 100%;
    width: 100%;
  }

  .text-container {
    background-color: rgba(0, 0, 0, 0.1); /* Transparent gray */
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden; /* Prevent text from overflowing the container */
  }

  .centered-text {
    text-align: center;
    margin: 0; /* Remove default margins from <p> tag */
  }

  .image-resize {
    width: 100%;
    height: 100%;
    user-select: none;
    pointer-events: none;
  }
</style>
