<script>
  import { windowStores } from "../../scripts/storage";
  import RichTextEditor from "../Elements/RichTextEditor.svelte";
  import { onMount } from "svelte";
  import { user } from "../../scripts/initGun"; // Import GunDB user

  let { uniqueID } = $props();
  const mainAppStore = $windowStores[uniqueID];

  // Function to save the data to GunDB
  const saveDataToGun = (blocks) => {
    user.get("windows").get(uniqueID).get("editorData").put({ blocks: JSON.stringify(blocks) });
  };

  // Function to load the data from GunDB
  const loadDataFromGun = async () => {
    console.log("TextEditor 'uniqueID': ", uniqueID);
    user.get("windows").get(uniqueID).once(data => {
      console.log(data);
    });
    user.get("windows").get(uniqueID).get("editorData").once((data, key) => {
      if (data && data.blocks) {
        const blocks = JSON.parse(data.blocks);
        console.log('Loaded blocks from GunDB:', blocks);
        mainAppStore.update(store => {
          store.blocks = blocks;
          return store;
        });
      }
    });
  };

  onMount(() => {
    loadDataFromGun();
  });

  // Initialize textStore to an empty string if not defined
  if (!mainAppStore.blocks) {
    mainAppStore.update(store => {
      store.blocks = [{ type: "paragraph", data: { text: "Start typing here..." } }];
      return store;
    });
  }

  // Update the mainAppStore when the editor content changes
  function handleEditorChange(blocks) {
    mainAppStore.update(store => {
      store.blocks = blocks;
      return store;
    });
    saveDataToGun(blocks);
  }
</script>

<div class="text-container">
  <RichTextEditor textStore={mainAppStore} on:change={handleEditorChange} />
</div>

<style>
  .text-container {
    width: 100%;
    height: 100%;
  }
</style>
