<script>
  import { get, writable } from "svelte/store";
  import { contentProperties, windowStores } from "../../scripts/storage";
  import { nowStr } from "../../scripts/utils";
  import DraggableResizable from "../DraggableResizable.svelte";
  import Background from "../Background.svelte";
  import { user } from "../../scripts/initGun";
  import { onMount } from "svelte";
  import Text from "../Elements/Text.svelte";
  import DraggableImage from "../Elements/DraggableImage.svelte";

  // @ts-nocheck

  export let uniqueID;

  // @ts-ignore
  const mainAppStore = windowStores[uniqueID];
  let images = [];
  let texts = [];

  // bind with gundb init
  const imageAppStore = writable({
    uniqueID: uniqueID + "-imageReferenceAppContent",
    hideOverflow: false,
    dragEventTarget: uniqueID + "-imageReferenceAppContent-mainDiv",
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

  // update active state across relevant components:
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
        if (data && data.imageUrl && data.imageUrl != "d") {
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
    dragEndFunc: function (store, event, x, y) {
      user.get("windows").get(uniqueID).get("workspaceData").put({ x: x, y: y });
    },
    scaleFunc: function (store, event, x, y, scale) {
      store.update((data) => {
        data.contentScale = $contentProperties.scale;
        return data;
      });
      user.get("windows").get(uniqueID).get("workspaceData").put({ x: x, y: y, scale: scale });
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

  // Function to handle pasted or dropped images
  function handleImageData(imageUrl) {
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
        .put({ imageUrl, imageStoreData });
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

  // Function to handle paste event (supporting both images and text)
  function handlePaste(event) {
    const items = event.clipboardData.items;

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (item.kind === "file" && item.type.includes("image")) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => handleImageData(e.target.result);
        reader.readAsDataURL(blob);
      } else if (item.kind === "string" && item.type === "text/plain") {
        item.getAsString((text) => handleTextPaste(text));
      }
    }
  }

  // Function to handle drop event
  function handleDrop(event) {
    event.preventDefault();

    // Check if files are being dropped
    if (event.dataTransfer.files.length > 0) {
      // Handle dropped files (images from file system)
      const file = event.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        handleImageData(imageUrl); // Pass the image data to the existing function for handling pasted images
      };
      reader.readAsDataURL(file);
    } else {
      // Handle dropped image URL (images from web)
      const htmlData = event.dataTransfer.getData("text/html"); // Get the dropped image URL
      const base64Regex = /src="data:image\/jpeg;base64,([^"]*)"/;
      const match = htmlData.match(base64Regex);

      if (match) {
        // Extract the Base64 encoded image data
        const base64Data = "data:image/jpeg;base64," + match[1];
        handleImageData(base64Data); // Pass the URL to the existing function for handling pasted images
      } else {
        console.log("No image data found in the HTML");
      }
    }
  }

  // Function to clear all images and texts
  function clearImages(event) {
    user.get("windows").get(uniqueID).get("imageAppData").get("images").map().put(null);
    user.get("windows").get(uniqueID).get("imageAppData").get("texts").map().put(null);
    images = [];
    texts = [];
  }
</script>

<!-- main div should listen to -->
<!-- paste event (ctrl+v) when mouse is over it and when the active window id equals uniqueid -->
<!--  -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  id={$imageAppStore.uniqueID + "-mainDiv"}
  class="main-image-app"
  on:mouseenter={() => self.addEventListener("paste", handlePaste)}
  on:mouseleave={() => self.removeEventListener("paste", handlePaste)}
  on:dragover={(event) => event.preventDefault()}
  on:drop={handleDrop}
>
  <div class="info-area">
    <button on:click={clearImages}>Delete All Text and Images</button>
    <span> Use CTRL + V or CMD + V (mac) to paste clipboard data</span>
  </div>

  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="draggable-area">
    <DraggableResizable
      uniqueID={$imageAppStore.uniqueID}
      store={imageAppStore}
      {...draggableFunctions}
    >
      <!-- image handling -->
      {#each images as { imageUrl, key, imageStore } (key)}
        <DraggableImage {imageUrl} uniqueID={key} {imageStore} {imageAppStore} />
      {/each}

      <!-- Text handling -->
      {#each texts as { key, textStore } (key)}
        <Text uniqueID={key} {textStore} {imageAppStore} />
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
    overflow: hidden;
    height: 100%;
    width: 100%;
  }
</style>
