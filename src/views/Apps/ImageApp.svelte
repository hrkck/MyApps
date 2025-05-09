<script>
  import { get, writable } from "svelte/store";
  import { contentProperties, windowStores } from "../../scripts/storage";
  import {
    cleanGunData,
    generateRandomString,
    listToObject,
    nowStr,
    unflattenToEditorJSData,
  } from "../../scripts/utils";
  import DraggableResizable from "../DraggableResizableScalableComponent/DraggableResizableScalable.svelte";
  import Background from "../Background.svelte";
  import { user } from "../../scripts/initGun";
  import { onDestroy, onMount } from "svelte";
  import Text from "../Elements/Text.svelte";
  import DraggableImage from "../Elements/DraggableImage.svelte";

  /**
   * @typedef {Object} Props
   * @property {any} uniqueID
   * @property {any} draggableAreaElement
   */

  /** @type {Props} */
  let { uniqueID, draggableAreaElement = $bindable() } = $props();
  const mainAppStore = windowStores[uniqueID];

  let images = $state([]);
  let texts = $state([]);
  let pasteListener;
  let shouldHandlePaste = false;

  // bind with gundb init
  const imageAppStore = writable({
    uniqueID: uniqueID + "-imageReferenceAppContent",
    mainAppStoreID: uniqueID,
    hideOverflow: false,
    dragEventTarget: uniqueID + "-imageReferenceAppContent-draggableArea",
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
    backgroundColor: "rgb(214, 255, 185)",
  });

  // update active state across relevant components:
  $effect(() => {
    // make each image also active when main app is active
    $imageAppStore.isActiveDraggable = $mainAppStore.isActive;
    images.forEach((imgObj) => {
      let { imageUrl, key, imageStore } = imgObj;
      imageStore.update((data) => {
        data.isActiveDraggable = $mainAppStore.isActive;
        return data;
      });
    });
    texts.forEach((txtObj) => {
      let { key, textStore } = txtObj;
      textStore.update((data) => {
        data.isActiveDraggable = $mainAppStore.isActive;
        return data;
      });
    });
  });

  onMount(async () => {
    await initializeAppData();

    document.addEventListener("paste", pasteListener, true);
  });

  onDestroy(() => {
    document.removeEventListener("paste", pasteListener, true);
  });

  async function initializeAppData() {
    // Save initial x,y and scale to gundb first. That is not done, so it is breaking the data integrity
    user
      .get("windows")
      .get(uniqueID)
      .get("workspaceData")
      .once((data) => {
        if (data) {
          console.log("first image app data: ", data);
          console.log("data scale: ", data.scale);
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
          try {
            const node = user
              .get("windows")
              .get(uniqueID)
              .get("imageAppData")
              .get("images")
              .get(key)
              .get("imageStoreData")
              .once((storeData) => {
                const existing = images.find((t) => t.key === storeData.uniqueID);
                if (existing) {
                  existing.imageStore.set(storeData); // update existing
                } else {
                  const imageStore = writable({ ...storeData });
                  images = [
                    ...images,
                    { imageUrl: data.imageUrl, key: storeData.uniqueID, imageStore },
                  ];
                }
              });
          } catch (error) {
            console.error(error);
          }
        }
      });

    // Initialize texts from GunDB
    let textStoresData = [];
    let blocks = [];
    user
      .get("windows")
      .get(uniqueID)
      .get("imageAppData")
      .get("texts")
      .map()
      .get("textStoreData")
      .once((data) => {
        if (data) {
          data = { ...cleanGunData(data), blocks: [] };
          textStoresData.push({ ...data });
        }
      })
      .get("blocks")
      .map()
      .once((block) => {
        if (block && block.textStoreID) {
          blocks.push(cleanGunData(block));
        }

        blocks = unflattenToEditorJSData(blocks);
        for (const block of blocks) {
          const storeData = textStoresData.find((ts) => ts.uniqueID === block.textStoreID);
          if (storeData) {
            storeData.blocks.push(block);
            storeData.blocks.sort((a, b) => a.order - b.order);
            const existing = texts.find((t) => t.key === storeData.uniqueID);
            if (existing) {
              existing.textStore.set(storeData); // update existing
            } else {
              const textStore = writable(storeData);
              texts = [...texts, { key: storeData.uniqueID, textStore }];
            }
          }
        }
      });

    // console.log(textStoresData);
    // console.log(blocks);

    // blocks = unflattenToEditorJSData(blocks);
    // for (const block of blocks) {
    //   const store = textStoresData.find((ts) => ts.uniqueID === block.textStoreID);
    //   if (store) {
    //     store.blocks.push(block);
    //   }
    // }

    // Sort the blocks by their order value
    // textStoresData.forEach((storeData) => {
    //   storeData.blocks.sort((a, b) => a.order - b.order);
    //   const textStore = writable(storeData);
    //   const key = storeData.uniqueID;

    //   texts = [...texts, { key, textStore }];
    // });

    console.log(texts);
  }

  const draggableFunctions = {
    dragStartFunc: function (store, event, x, y) {
      store.update((data) => {
        data.contentScale = $contentProperties.scale;
        return data;
      });
    },
    dragEndFunc: async function (store, event, x, y) {
      user.get("windows").get(uniqueID).get("workspaceData").put({ x: x, y: y });
    },
    scaleFunc: function (store, event, x, y, scale) {
      if ($imageAppStore.isCursorInsideEditor) return;
      if (scale == undefined) scale = 1;

      store.update((store) => {
        store.contentScale = $contentProperties.scale;
        if (scale > 0.05 && scale < 7) {
          store.x =
            (store.x - x / store.contentScale) * (scale / store.scale) + x / store.contentScale;
          store.y =
            (store.y - y / store.contentScale) * (scale / store.scale) + y / store.contentScale;
          store.scale = scale;
        }
        return store;
      });

      user
        .get("windows")
        .get(uniqueID)
        .get("workspaceData")
        .put({ x: x, y: y, scale: scale, contentScale: $contentProperties.scale });
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
    isCursorInsideEditor: false,
    imageAppBackgroundX: 0,
    imageAppBackgroundY: 0,
    imageAppBackgroundScale: 1,
  };

  // Assuming `x` and `y` are the mouse event's clientX and clientY
  // function calculateImagePosition(x, y) {
  //   // Step 1: Get the bounding rectangle of the green area (image app)
  //   const rect = draggableAreaElement.getBoundingClientRect();
  //   const coordinates = { x: rect.left + window.scrollX, y: rect.top + window.scrollY };

  //   // Step 2: Adjust for the main content's scaling and translation
  //   const mainContentX = (x - coordinates.x - $contentProperties.x) / $contentProperties.scale;
  //   const mainContentY = (y - coordinates.y - $contentProperties.y) / $contentProperties.scale;

  //   // Step 3: Adjust for the image app's scaling and translation within the main content
  //   const imageAppX = (mainContentX - $imageAppStore.x) / $imageAppStore.scale;
  //   const imageAppY = (mainContentY - $imageAppStore.y) / $imageAppStore.scale;

  //   return { x: imageAppX, y: imageAppY };
  // }

  // Function to handle pasted or dropped images
  function handleImageData(imageUrl, x, y) {
    const imageObj = new Image();
    imageObj.onload = async function () {
      const key = `ref-img-${nowStr()}`;

      let coordinates = { x: 0, y: 0 };
      const rect = draggableAreaElement.getBoundingClientRect();
      coordinates = { x: rect.left + window.scrollX, y: rect.top + window.scrollY };

      // const { x: imageX, y: imageY } = calculateImagePosition(x, y);

      const imageStore = writable({
        uniqueID: key,
        boxShadow: false,
        keepRatio: true,
        width: this.naturalWidth,
        height: this.naturalHeight,
        ...itemProperties,
        x:
          ((x - coordinates.x) / $contentProperties.scale - $imageAppStore.x) /
          $imageAppStore.scale,
        y:
          ((y - coordinates.y) / $contentProperties.scale - $imageAppStore.y) /
          $imageAppStore.scale,
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
  function handleTextPaste(text, x, y) {
    const key = `ref-text-${nowStr()}`;
    if (texts.some((t) => t.key === key)) return;

    let coordinates = { x: 0, y: 0 };
    const rect = draggableAreaElement.getBoundingClientRect();
    coordinates = { x: rect.left + window.scrollX, y: rect.top + window.scrollY };

    // Initialize the blocks data in GunDB
    let randomBlockID = generateRandomString(10);
    const blocks = [
      { textStoreID: key, order: 0, id: randomBlockID, type: "paragraph", data: { text: text } },
    ];

    const objBlocks = listToObject(blocks);
    const textStore = writable({
      uniqueID: key,
      boxShadow: true,
      keepRatio: false,
      width: 200,
      height: 200,
      blocks: objBlocks,
      ...itemProperties,
      x: ((x - coordinates.x) / $contentProperties.scale - $imageAppStore.x) / $imageAppStore.scale,
      y: ((y - coordinates.y) / $contentProperties.scale - $imageAppStore.y) / $imageAppStore.scale,
    });

    // Save text data to GunDB
    const textStoreData = get(textStore);
    user
      .get("windows")
      .get(uniqueID)
      .get("imageAppData")
      .get("texts")
      .get(key)
      .put({ textStoreData }, (ack) => {
        if (ack.err) {
          console.error("Error saving text to GunDB:", ack.err);
        } else {
          // console.log("Successfully saved text to GunDB:", ack);
        }
      });

    textStore.update((store) => {
      const newStore = { ...store, blocks: blocks };
      return newStore;
    });
    texts = [...texts, { key, textStore }];
  }

  //  on mouseenter
  function enablePasteHandler() {
    shouldHandlePaste = true;
  }

  //  on mouseleave
  function disablePasteHandler() {
    shouldHandlePaste = false;
  }

  pasteListener = (event) => {
    if (!shouldHandlePaste) return;
    // Don't interfere if any Editor has focus
    if (texts.some((text) => get(text.textStore).isCursorInsideEditor)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation(); // <--- this is critical

    const items = event.clipboardData.items;
    handlePaste(items);

    // Add listener in capture phase to beat Editor.js
  };

  // Function to handle paste event (supporting both images and text)
  function handlePaste(items) {
    // GET MOUSE X AND Y data from event
    // Initialize items at these locations
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (item.kind === "file" && item.type.includes("image")) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          handleImageData(e.target.result, $contentProperties.mouseX, $contentProperties.mouseY);
        };
        reader.readAsDataURL(blob);
      } else if (item.kind === "string" && item.type === "text/plain") {
        item.getAsString((text) =>
          handleTextPaste(text, $contentProperties.mouseX, $contentProperties.mouseY),
        );
      }
    }
  }

  // Function to handle drop event
  function handleDrop(event) {
    event.preventDefault();
    // GET MOUSE X AND Y data from event
    // Initialize items at these locations

    // Check if files are being dropped
    if (event.dataTransfer.files.length > 0) {
      // Handle dropped files (images from file system)
      const file = event.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        handleImageData(imageUrl, $contentProperties.mouseX, $contentProperties.mouseY); // Pass the image data to the existing function for handling pasted images
      };
      reader.readAsDataURL(file);
    } else {
      // Handle dropped image URL or text
      const htmlData = event.dataTransfer.getData("text/html"); // Get the dropped image URL
      const plainText = event.dataTransfer.getData("text/plain"); // Get the dropped plain text
      const base64Regex = /src="data:image\/jpeg;base64,([^"]*)"/;
      const match = htmlData.match(base64Regex);

      if (match) {
        // Extract the Base64 encoded image data
        const base64Data = "data:image/jpeg;base64," + match[1];
        handleImageData(base64Data, $contentProperties.mouseX, $contentProperties.mouseY); // Pass the URL to the existing function for handling pasted images
      } else if (plainText) {
        handleTextPaste(plainText, $contentProperties.mouseX, $contentProperties.mouseY); // Handle dropped text
      } else {
        console.log("No image or text data found in the drop event");
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

  function fin() {
    // console.log("mouse over green area");
  }
  function fout() {
    // console.log("mouse OUT OF green area");
  }
</script>

<!-- main div should listen to -->
<!-- paste event (ctrl+v) when mouse is over it and when the active window id equals uniqueid -->
<!--  -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  id={$imageAppStore.uniqueID + "-mainDiv"}
  class="main-image-app"
  onmouseenter={enablePasteHandler}
  onmouseleave={disablePasteHandler}
  ondragover={(event) => event.preventDefault()}
  ondrop={handleDrop}
>
  <div class="info-area ghost-slate">
    <button onclick={clearImages}>Delete All Text and Images</button>
    <span> Use CTRL + V or CMD + V (mac) to paste clipboard data</span>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <div
    bind:this={draggableAreaElement}
    id={$imageAppStore.uniqueID + "-draggableArea"}
    class="draggable-area"
    onmouseenter={fin}
    onmouseleave={fout}
  >
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
