<script>
  import { windowStores } from "../../scripts/storage";
  import RichTextEditor from "../Elements/RichTextEditor.svelte";
  import { onMount } from "svelte";
  import { user } from "../../scripts/initGun"; // Import GunDB user
  import { cleanGunData, generateRandomString, listToObject, unflattenToEditorJSData } from "../../scripts/utils";
    import { get } from "svelte/store";
    import { Store } from "gun/lib/rindexed";

  let { uniqueID } = $props();
  console.log(uniqueID);
  console.log($windowStores);
  const mainAppStore = $windowStores[uniqueID];

  // Function to save the data to GunDB
  const saveDataToGun = (blocks) => {
    const mainAppStoreData = get(mainAppStore);
    user
      .get("windows")
      .get(uniqueID)
      .get("editorData")
      .put({ mainAppStoreData });
  };

  // Function to load the data from GunDB
  const loadDataFromGun = async () => {
    console.log("TextEditor 'uniqueID': ", uniqueID);

    let blocks = [];
    
    user
      .get("windows")
      .get(uniqueID)
      .once((data) => {
        console.log(data);
      });
    user
      .get("windows")
      .get(uniqueID)
      .get("editorData")
      .get("mainAppStoreData")
      .once((data) => {
        if (data && data.blocks) {
          blocks.push(cleanGunData(data.blocks));
        }

        console.log(get(mainAppStore));
        blocks = unflattenToEditorJSData(blocks);
        blocks.sort((a, b) => a.order - b.order);
        mainAppStore.update(store=>{
          store.blocks = blocks;
          return store
        })
        console.log(get(mainAppStore));
      });

      // .once((data, key) => {
      //   if (data && data.blocks) {
      //     const blocks = JSON.parse(data.blocks);
      //     console.log("Loaded blocks from GunDB:", blocks);
      //     mainAppStore.update((store) => {
      //       store.blocks = blocks;
      //       return store;
      //     });
      //   }
      // });
  };

  onMount(() => {
    loadDataFromGun();
  });

  // Initialize textStore to an empty string if not defined
  if (!mainAppStore.blocks) {
    let randomBlockID = generateRandomString(10);
    const blocks = [
      {
        textStoreID: uniqueID,
        order: 0,
        id: randomBlockID,
        type: "paragraph",
        data: { text: "Start typing here..." },
      },
    ];
    const objBlocks = listToObject(blocks);

    mainAppStore.update((store) => {
      store.blocks = blocks;
      return store;
    });

    console.log('saving data to gundb during init');
    saveDataToGun(objBlocks);
  }

  // Update the mainAppStore when the editor content changes
  function handleEditorChange(event) {
    const blocks = event.detail.blocks;
    console.log(blocks);

    mainAppStore.update((store) => {
      store.blocks = blocks;
      return store;
    });
    saveDataToGun(blocks);
  }
</script>

<div class="text-container">
  <RichTextEditor textStore={mainAppStore} on:contentChanged={handleEditorChange} />
</div>

<style>
  .text-container {
    width: 100%;
    height: 100%;
  }
</style>
