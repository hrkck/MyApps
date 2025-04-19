<script>
  import { run } from 'svelte/legacy';

  import { get, writable } from "svelte/store";
  import { contentProperties, windowStores } from "../../scripts/storage";
  import { cleanGunData, generateRandomString, nowStr } from "../../scripts/utils";
  import DraggableResizable from "../DraggableResizableScalableComponent/DraggableResizableScalable.svelte";
  import Background from "../Background.svelte";
  import { user } from "../../scripts/initGun";
  import { onMount } from "svelte";
  import Text from "../Elements/Text.svelte";
  import DraggableImage from "../Elements/DraggableImage.svelte";

  

  /**
   * @typedef {Object} Props
   * @property {any} uniqueID
   * @property {any} draggableAreaElement
   */

  /** @type {Props} */
  let { uniqueID, draggableAreaElement = $bindable() } = $props();
  // @ts-ignore
  const mainAppStore = windowStores[uniqueID];
  let images = $state([]);
  
  let texts = $state([]);
  let isCursorInsideEditor = false;

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
    isCursorInsideEditor: false,
    backgroundColor: "rgb(214, 255, 185)",
  });
  // @ts-ignore

  // update active state across relevant components:
  run(() => {
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
    console.log($imageAppStore.dragEventTarget);

  });  

  async function fetchStoreData(dataType, key, storeProperty) {
    if (storeProperty === "textStoreData") {
      return fetchBlocksData(dataType, key);
    }
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
            resolve(cleanGunData(data));
          } else {
            reject(new Error(`No data found for ${dataType}/${key}/${storeProperty}`));
          }
        });
    });
  }

  async function fetchTextStoreData(dataType, key) {
    return new Promise((resolve, reject) => {
      user
        .get("windows")
        .get(uniqueID) // Use the appropriate uniqueID here
        .get("imageAppData")
        .get(dataType)
        .get(key)
        .get("textStoreData")
        .once((data) => {
          if (data) {
            console.log("Fetching: ", dataType, key, cleanGunData(data));
            resolve(cleanGunData(data));
          } else {
            reject(new Error(`No data found for ${dataType}/${key}/textStoreData`));
          }
        });
    });
  }

  async function fetchBlocksData(dataType, key) {
    return new Promise((resolve, reject) => {
      user
        .get("windows")
        .get(uniqueID) // Use the appropriate uniqueID here
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
        .get(uniqueID)
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
            // console.log("BLOCK: |", cleanGunData(block));

            // console.log("READHING SOMETHING:");
            // let something = resolvePath(["windows", uniqueID, "imageAppData", 'textStoreData', key, "textStoreData", "blocks", blockId, 'data'])
            // console.log("something: ", something);

            // Fetch any nested image URLs
            let whatever = await fetchNestedImageUrls(dataType, key, blockId);
            // console.log("this is whatever: ", whatever);
            block.data.file = {url: whatever.url}

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
        .get(uniqueID) // Use the appropriate uniqueID here
        .get("imageAppData")
        .get(dataType)
        .get(key)
        .get("textStoreData")
        .get("blocks")
        .get(blockId)
        .get(innerKey)
        .once((data) => {
          if (data) {
            console.log("block inner data:");
            console.log(data);
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

  async function fetchNestedImageUrls(dataType, key, blockId) {
    return new Promise((resolve, reject) => {
      user
        .get("windows")
        .get(uniqueID) // Use the appropriate uniqueID here
        .get("imageAppData")
        .get(dataType)
        .get(key)
        .get("textStoreData")
        .get("blocks")
        .get(blockId)
        .get("data")
        // .get("file") FOR SOME REASON I CANNOT SAVE IN FILE AS EDITORJS SAVES IT
        .once((data) => {
          if (data) {
            // console.log("SUPPOSED IMAGE DATA:", data);
            // console.log(data);
            resolve(cleanGunData(data));
          } else {
            reject(
              new Error(
                `No data found for ${dataType}/${key}/textStoreData/blocks/${blockId}/file/data/url`,
              ),
            );
          }
        });
    });
  }

  async function initializeAppData() {
    // Save initial x,y and scale to gundb first. That is not done, so it is breaking the data integrity
    user
      .get("windows")
      .get(uniqueID)
      .get("workspaceData")
      .once((data) => {
        if (data) {
          // console.log("first image app data: ", data);
          // console.log("data scale: ", data.scale);
          $imageAppStore.x = data.x;
          $imageAppStore.y = data.y;
          $imageAppStore.scale = data.scale;
          $imageAppStore.contentScale = $contentProperties.scale;
        }
      });

    // Fetch and initialize data from GunDB
    // Initialize images from GunDB

    // console.log(uniqueID);
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
            let imageStoreData = await fetchStoreData("images", key, "imageStoreData");
            // console.log("images ImageStoreData for key: ", key);
            // console.log(imageStoreData);
            const imageStore = writable({
              ...imageStoreData,
              imageUrl: data.imageUrl,
            });
            images = [...images, { imageUrl: data.imageUrl, key, imageStore }];
          } catch (error) {
            console.error(error);
          }
        }
      });

    // Initialize texts from GunDB
    console.log("initing text:");
    user
      .get("windows")
      .get(uniqueID)
      .get("imageAppData")
      .get("texts")
      .map()
      .once(async (data, key) => {
        // console.log(data, key);
        if (data && key) {
          if (texts.some((t) => t.key === key)) {
            // console.log(texts);
            return;
          }
          try {
            // console.log('Trying to init "text block", here is the ID:');
            // console.log(key);

            // Fetch the text store data without the blocks
            const textStoreData = await fetchTextStoreData("texts", key);
            const editorJSBlocks = await fetchStoreData("texts", key, "textStoreData");
            // console.log("Fetched editorJSBlocks:", editorJSBlocks);
            // console.log("Fetched textStoreData:", textStoreData);
            // console.log("And THIS IS DATA: ", data);

            // Initialize the textStore with the fetched data
            const textStore = writable({
              ...textStoreData,
              text: data.text,
              blocks: editorJSBlocks,
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
      // console.log("drag starting , ", $mainAppStore.isActive);
      store.update((data) => {
        data.contentScale = $contentProperties.scale;
        return data;
      });
    },
    // @ts-ignore
    dragEndFunc: async function (store, event, x, y) {
      user.get("windows").get(uniqueID).get("workspaceData").put({ x: x, y: y });
    },
    scaleFunc: function (store, event, x, y, scale) {
      // console.log('trying to scale 2');
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

  // Assuming `x` and `y` are the mouse event's clientX and clientY
  function calculateImagePosition(x, y) {
    // Step 1: Get the bounding rectangle of the green area (image app)
    const rect = draggableAreaElement.getBoundingClientRect();
    const coordinates = { x: rect.left + window.scrollX, y: rect.top + window.scrollY };

    // Step 2: Adjust for the main content's scaling and translation
    const mainContentX = (x - coordinates.x - $contentProperties.x) / $contentProperties.scale;
    const mainContentY = (y - coordinates.y - $contentProperties.y) / $contentProperties.scale;

    // Step 3: Adjust for the image app's scaling and translation within the main content
    const imageAppX = (mainContentX - $imageAppStore.x) / $imageAppStore.scale;
    const imageAppY = (mainContentY - $imageAppStore.y) / $imageAppStore.scale;

    return { x: imageAppX, y: imageAppY };
  }

  // Function to handle pasted or dropped images
  function handleImageData(imageUrl, x, y) {
    const imageObj = new Image();
    imageObj.onload = async function () {
      const key = `ref-img-${nowStr()}`;

      let coordinates = { x: 0, y: 0 };
      const rect = draggableAreaElement.getBoundingClientRect();
      coordinates = { x: rect.left + window.scrollX, y: rect.top + window.scrollY };

      const { x: imageX, y: imageY } = calculateImagePosition(x, y);

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
    if($imageAppStore.isCursorInsideEditor) return;

    const key = `ref-text-${nowStr()}`;
    if (texts.some((t) => t.key === key)) return;

    let coordinates = { x: 0, y: 0 };
    const rect = draggableAreaElement.getBoundingClientRect();
    coordinates = { x: rect.left + window.scrollX, y: rect.top + window.scrollY };

    // Initialize the blocks data in GunDB
    let randomBlockID = generateRandomString(10);
    const blocks = [{ id: randomBlockID, type: "paragraph", data: { text: text } }];

    const textStore = writable({
      text: text,
      uniqueID: key,
      boxShadow: true,
      keepRatio: false,
      width: 200,
      height: 200,
      // blocks: blocks,
      ...itemProperties,
      x: ((x - coordinates.x) / $contentProperties.scale - $imageAppStore.x) / $imageAppStore.scale,
      y: ((y - coordinates.y) / $contentProperties.scale - $imageAppStore.y) / $imageAppStore.scale,
    });

    texts = [...texts, { key, textStore }];

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
          console.log("Successfully saved text to GunDB:", ack);
        }
      });

      textStore.update((store)=>{
        const newStore = {blocks:blocks, ...store};
        return newStore;
      })
    
    console.log("pretending to put blocks in gundb when pasting text");
    blocks.forEach((block) => {
      user
        .get("windows")
        .get(uniqueID)
        .get("imageAppData")
        .get("texts")
        .get(key)
        .get("textStoreData")
        .get("blocks")
        .get(block.id)
        .put(block, (ack) => {
          if (ack.err) {
            console.error("Error saving block to GunDB:", ack.err);
          } else {
            console.log(`Successfully saved block ${block.id} to GunDB:`, block);
          }
        });
    });
  }

  // Function to handle paste event (supporting both images and text)
  function handlePaste(event) {
    // GET MOUSE X AND Y data from event
    // Initialize items at these locations
    const items = event.clipboardData.items;

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (item.kind === "file" && item.type.includes("image")) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          // console.log(e);
          // console.log(event);
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
</script>

<!-- main div should listen to -->
<!-- paste event (ctrl+v) when mouse is over it and when the active window id equals uniqueid -->
<!--  -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  id={$imageAppStore.uniqueID + "-mainDiv"}
  class="main-image-app"
  onmouseenter={() => self.addEventListener("paste", handlePaste)}
  onmouseleave={() => self.removeEventListener("paste", handlePaste)}
  ondragover={(event) => event.preventDefault()}
  ondrop={handleDrop}
>
  <div class="info-area ghost-slate">
    <button onclick={clearImages}>Delete All Text and Images</button>
    <span> Use CTRL + V or CMD + V (mac) to paste clipboard data</span>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={draggableAreaElement}
    id={$imageAppStore.uniqueID + "-draggableArea"}
    class="draggable-area"
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
        <Text uniqueID={key} {isCursorInsideEditor} {textStore} {imageAppStore} />
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
