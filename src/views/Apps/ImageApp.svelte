<script>
  import { get, writable } from "svelte/store";
  import { contentProperties, createStore, windowStores } from "../../scripts/storage";
  import {
    cleanGunData,
    containViewToImages,
    generateRandomString,
    getImageDimensions,
    listToObject,
    nowStr,
    readImageAsDataURL,
    unflattenToEditorJSData,
  } from "../../scripts/utils";
  import DraggableResizable from "../DraggableResizableScalableComponent/DraggableResizableScalable.svelte";
  import Background from "../Background.svelte";
  import { gun, user } from "../../scripts/initGun";
  import { onDestroy, onMount } from "svelte";
  import Text from "../Elements/Text.svelte";
  import DraggableImage from "../Elements/DraggableImage.svelte";
  import ZoomIndicator from "../Utility/ZoomIndicator.svelte";

  /**
   * @typedef {Object} Props
   * @property {any} uniqueID
   * @property {any} draggableAreaElement
   */

  /** @type {Props} */
  let { uniqueID, draggableAreaElement = $bindable() } = $props();
  const mainAppStore = $windowStores[uniqueID];

  let zoomIndicatorRef;

  let images = $state([]);
  let texts = $state([]);
  let pasteListener;
  let shouldHandlePaste = false;

  let loading = $state(true);

  // Constants
  const IMAGE_GAP = 100;

  // bind with gundb init
  const imageAppStoreRef = gun.get("windows").get(uniqueID).get("imageAppStore");
  const imageAppStore = createStore(imageAppStoreRef); // writable();
  const imageAppStoreProps = {
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
    backgroundColor: "rgb(245, 255, 247)",
  };
  imageAppStore.set(imageAppStoreProps);
  imageAppStoreRef.put(imageAppStoreProps);

  const unsubMainAppStore = mainAppStore.subscribe((mainAppStoreData) => {
    $imageAppStore.isActiveDraggable = mainAppStoreData.isActive;
    images.forEach((imgObj) => {
      let { imageUrl, key, imageStore } = imgObj;
      imageStore.update((data) => {
        data.isActiveDraggable = mainAppStoreData.isActive;
        return data;
      });
    });
    texts.forEach((txtObj) => {
      let { key, textStore } = txtObj;
      textStore.update((data) => {
        data.isActiveDraggable = mainAppStoreData.isActive;
        return data;
      });
    });
  });

  onMount(async () => {
    await initializeAppData();
    loading = false;
    document.addEventListener("paste", pasteListener, true);
  });

  onDestroy(() => {
    document.removeEventListener("paste", pasteListener, true);
    unsubMainAppStore();
  });

  async function initializeAppData() {
    // Fetch and initialize data from GunDB
    // Save initial x,y and scale to gundb first.
    user
      .get("windows")
      .get(uniqueID)
      .get("workspaceData")
      .once((data) => {
        if (data) {
          imageAppStore.update((s) => {
            return {
              ...s,
              x: data.x,
              y: data.y,
              scale: data.scale,
              contentScale: $contentProperties.scale,
            };
          });
        }
      });

    // Initialize images from GunDB
    await new Promise((resolve) => {
      user
        .get("windows")
        .get(uniqueID)
        .get("imageAppData")
        .get("images")
        .once(async (listOfImageKeys) => {
          if (!listOfImageKeys || typeof listOfImageKeys !== "object") {
            resolve();
            return;
          }
          const keys = Object.keys(listOfImageKeys).filter(
            (k) => k && !k.startsWith("_"), // ignore metadata keys
          );

          for (const key of keys) {
            // Step 2: Load image metadata
            const imageMeta = await new Promise((resolve) => {
              user
                .get("windows")
                .get(uniqueID)
                .get("imageAppData")
                .get("images")
                .get(key)
                .once(resolve);
            });

            if (!imageMeta || imageMeta.imageUrl === "d") continue;
            // Step 3: Load imageStoreData
            try {
              const storeData = await new Promise((resolve, reject) => {
                user
                  .get("windows")
                  .get(uniqueID)
                  .get("imageAppData")
                  .get("images")
                  .get(key)
                  .get("imageStoreData")
                  .once((data) => {
                    if (data) resolve(cleanGunData(data));
                    else reject(new Error(`No imageStoreData for key: ${key}`));
                  });
              });

              const existing = images.find((t) => t.key === storeData.uniqueID);
              if (existing) {
                existing.imageStore.set(storeData); // Update
                existing.imageUrl = imageMeta.imageUrl;
              } else {
                const imageStore = writable({ ...storeData });

                images = [
                  ...images,
                  {
                    imageUrl: imageMeta.imageUrl,
                    key: storeData.uniqueID,
                    imageStore,
                  },
                ];
              }
            } catch (error) {
              console.error(`Error loading storeData for ${key}:`, error);
            }
          }
          resolve();
        });
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
      if (texts.some((text) => get(text.textStore).isCursorInsideEditor)) return;
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

        // Compute visible size

        const containerRect = draggableAreaElement.getBoundingClientRect();
        const totalScale = $contentProperties.scale * store.scale; // combine scales

        const visibleWidth = containerRect.width / totalScale;
        const visibleHeight = containerRect.height / totalScale;

        // Show zoom indicator
        zoomIndicatorRef?.show(visibleWidth, visibleHeight);
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

  // Function to handle pasted or dropped images
  function handleImageData(imageUrl, x, y) {
    const imageObj = new Image();
    imageObj.onload = async function () {
      const key = `ref-img-${nowStr()}`;

      const imageStore = writable({
        uniqueID: key,
        boxShadow: false,
        keepRatio: true,
        width: this.naturalWidth,
        height: this.naturalHeight,
        ...itemProperties,
        x,
        y,
      });

      images = [...images, { imageUrl, key, imageStore }];

      const imageStoreData = get(imageStore);
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
  function handleTextData(text, x, y) {
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

  async function extractImagesAndTextFromItems(items) {
    const imagePromises = [];
    let pendingPlainText = null;

    for (const item of items) {
      if (item.kind === "file" && item.type.includes("image")) {
        const file = item.getAsFile();
        imagePromises.push(
          readImageAsDataURL(file).then((dataUrl) =>
            getImageDimensions(dataUrl).then((dims) => ({
              dataUrl,
              width: dims.width,
              height: dims.height,
            })),
          ),
        );
      } else if (
        item.kind === "string" &&
        (item.type === "text/plain" || item.type === "text/html")
      ) {
        const textOrHtmlPromise = new Promise((resolve) => {
          item.getAsString((str) => {
            if (item.type === "text/plain") {
              pendingPlainText = str;
              resolve(null);
            } else if (item.type === "text/html") {
              // Extract base64 image if present
              const base64Regex = /src="(data:image\/[^;]+;base64,[^"]*)"/;
              const match = str.match(base64Regex);
              if (match) {
                getImageDimensions(match[1]).then((dims) =>
                  resolve({ dataUrl: match[1], width: dims.width, height: dims.height }),
                );
              } else resolve(null);
            }
          });
        });
        imagePromises.push(textOrHtmlPromise);
      }
    }

    const results = await Promise.all(imagePromises);
    const images = results.filter((r) => r && r.dataUrl);
    return { images, pendingPlainText };
  }

  async function handleMultipleImages(imageDataUrls, mouseX, mouseY) {
    const images = await Promise.all(imageDataUrls.map(getImageDimensions));

    // Sort by width descending
    images.sort((a, b) => b.width - a.width);

    // Get transformed base position in workspace coordinates
    const rect = draggableAreaElement.getBoundingClientRect();
    const originX =
      ((mouseX - rect.left - window.scrollX) / $contentProperties.scale - $imageAppStore.x) /
      $imageAppStore.scale;

    const originY =
      ((mouseY - rect.top - window.scrollY) / $contentProperties.scale - $imageAppStore.y) /
      $imageAppStore.scale;

    // Layout loop
    let offsetX = 0;
    let offsetY = 0;
    let rowHeight = 0;

    let imgPositions = [];
    const MAX_ROW_WIDTH = IMAGE_GAP * 2 + Math.max(...images.map((img) => img.width)) * 4;
    for (const img of images) {
      if (offsetX + img.width > MAX_ROW_WIDTH) {
        offsetX = 0;
        offsetY += rowHeight + IMAGE_GAP;
        rowHeight = 0;
      }

      const finalX = originX + offsetX;
      const finalY = originY + offsetY;

      handleImageData(img.dataUrl, finalX, finalY);
      imgPositions.push({ x: finalX, y: finalY, width: img.width, height: img.height });

      offsetX += img.width + IMAGE_GAP;
      rowHeight = Math.max(rowHeight, img.height);
    }
    if (images.length > 1) {
      containViewToImages(
        imgPositions,
        imageAppStore,
        draggableAreaElement.getBoundingClientRect(),
      );
    }
  }

  // Function to handle drop event
  async function handleDrop(event) {
    event.preventDefault();
    const mouseX = $contentProperties.mouseX;
    const mouseY = $contentProperties.mouseY;
    const items = event.dataTransfer.items;
    const { images, pendingPlainText } = await extractImagesAndTextFromItems(items);

    if (images.length) {
      handleMultipleImages(
        images.map((img) => img.dataUrl),
        mouseX,
        mouseY,
      );
    }
    if (pendingPlainText) {
      handleTextData(pendingPlainText, mouseX, mouseY);
    }
  }

  // Function to clear all images and texts
  function clearImages(event) {
    user.get("windows").get(uniqueID).get("imageAppData").get("images").map().put(null);
    user.get("windows").get(uniqueID).get("imageAppData").get("texts").map().put(null);
    images = [];
    texts = [];
  }

  // Function to handle paste event (supporting both images and text)
  async function handlePaste(items) {
    const mouseX = $contentProperties.mouseX;
    const mouseY = $contentProperties.mouseY;
    const { images, pendingPlainText } = await extractImagesAndTextFromItems(items);

    if (images.length) {
      handleMultipleImages(
        images.map((img) => img.dataUrl),
        mouseX,
        mouseY,
      );
    }
    if (pendingPlainText) {
      handleTextData(pendingPlainText, mouseX, mouseY);
    }
  }

  //  on mouseenter
  function enablePasteHandler() {
    shouldHandlePaste = true;
  }

  //  on mouseleave
  function disablePasteHandler() {
    shouldHandlePaste = false;
  }

  // Add listener in capture phase to beat Editor.js
  pasteListener = (event) => {
    if (!shouldHandlePaste) return;
    // Don't interfere if any Editor has focus
    if (texts.some((text) => get(text.textStore).isCursorInsideEditor)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    const items = event.clipboardData.items;
    handlePaste(items);
  };

  function fin() {
    // console.log("mouse over green area");
  }
  function fout() {
    // console.log("mouse OUT OF green area");
  }
</script>

<ZoomIndicator bind:this={zoomIndicatorRef} />

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
      <!-- {#if loading} -->
      <!-- content here -->
      <!-- <h1>LOADING</h1> -->
      <!-- {:else} -->
      <!-- image handling -->
      {#each images as { imageUrl, key, imageStore } (key)}
        <DraggableImage
          {imageUrl}
          uniqueID={key}
          {imageStore}
          {imageAppStore}
          imageAppContainer={draggableAreaElement}
        />
      {/each}

      <!-- Text handling -->
      {#each texts as { key, textStore } (key)}
        <Text uniqueID={key} {textStore} {imageAppStore} />
      {/each}
      <!-- {/if} -->
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
