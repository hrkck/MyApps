<script>
  import { onMount, afterUpdate, onDestroy, createEventDispatcher } from "svelte";
  import { get } from "svelte/store";
  import EditorJS from "@editorjs/editorjs";
  import Header from "@editorjs/header";
  import List from "@editorjs/list";
  import Checklist from "@editorjs/checklist";
  import Quote from "@editorjs/quote";
  import CodeTool from "@editorjs/code";
  import InlineCode from "@editorjs/inline-code";
  import ImageTool from "@editorjs/image";
  import { user } from "../../scripts/initGun"; // Ensure this import

  export let textStore;
  export let uniqueID;
  export let mainAppStoreUniqueID;
  const dispatch = createEventDispatcher();

  let editor;
  let editorContainer;
  let isEditorReady = false;

  const handleFileUpload = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve({
          success: 1,
          file: {
            url: event.target.result,
          },
        });
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(file);
    });
  };

  const initializeEditor = async () => {
    if (editor) {
      console.log("Editor already initialized.");
      return;
    }

    const blocks = get(textStore).blocks || [
      { type: "paragraph", data: { text: "Start typing here..." } },
    ];

    // console.log($textStore);

    if (!Array.isArray(blocks) || blocks.length === 0 || typeof blocks[0] !== "object") {
      console.log("Blocks are not ready yet. Waiting for textStore to be populated.");
      return;
    }

    // console.log("This what blocks is intially: ", blocks);

    if (blocks.length === 0) {
      console.log("Blocks are not ready yet. Waiting for textStore to be populated.");
      return;
    }

    editor = new EditorJS({
      holder: editorContainer,
      tools: {
        header: Header,
        list: List,
        checklist: Checklist,
        quote: Quote,
        code: CodeTool,
        inlineCode: InlineCode,
        image: {
          class: ImageTool,
          config: {
            uploader: {
              uploadByFile: handleFileUpload,
              uploadByUrl: async (url) => {
                return {
                  success: 1,
                  file: {
                    url: url,
                  },
                };
              },
            },
          },
        },
      },
      data: { blocks },
      onReady: () => {
        // console.log("Editor.js is ready to work!");
        isEditorReady = true;
      },
      onChange: async (api, event) => {
        // console.log("Editor's content changed!", event);
        if (editor) {
          try {
            const content = await editor.save();
            // console.log("Saved content:", content);
            if (validateBlocks(content.blocks)) {
              // console.log(content.blocks);
              textStore.update((store) => {
                store.blocks = content.blocks;
                // console.log("text store after attempting data save");
                // console.log(store);
                return store;
              });
              // console.log(content);
              saveToGunDB(content); // Save entire content to GunDB
            } else {
              console.warn("Invalid block data detected, skipping update.");
            }
          } catch (error) {
            console.error("Error saving content:", error);
          }
        }
      },
    });

    try {
      await editor.isReady;
      console.log("Editor.js is ready to work!");
      isEditorReady = true;
    } catch (reason) {
      console.log(`Editor.js initialization failed because of ${reason}`);
    }
  };

  const updateEditorContent = async () => {
    if (isEditorReady && editor) {
      const blocks = get(textStore).blocks || [];
      // console.log("Updating editor content:", blocks);
      try {
        const currentContent = await editor.save();
        if (JSON.stringify(currentContent.blocks) !== JSON.stringify(blocks)) {
          // console.log("Rendering new blocks:", blocks);
          editor.render({ blocks });
        }
      } catch (error) {
        console.error("Error updating content:", error);
      }
    }
  };

  const destroyEditor = () => {
    if (editor) {
      // console.log("Destroying editor.");
      editor.destroy();
      editor = null;
    }
  };

  const validateBlocks = (blocks) => {
    // Basic validation for blocks structure
    return (
      Array.isArray(blocks) &&
      blocks.every((block) => {
        return (
          block.type &&
          typeof block.type === "string" &&
          block.data &&
          typeof block.data === "object" &&
          block.data.text &&
          typeof block.data.text === "string"
        );
      })
    );
  };

  const saveToGunDB = (content) => {
    content.blocks.forEach((block) => {
      user
        .get("windows")
        .get(mainAppStoreUniqueID)
        .get("imageAppData")
        .get("texts")
        .get(uniqueID)
        .get("textStoreData")
        .get("blocks")
        .get(block.id)
        .put(block, (ack) => {
          if (ack.err) {
            console.error("Error saving block to GunDB:", ack.err);
          } else {
            // console.log(`Successfully saved block ${block.id} to GunDB:`, block);
          }
        });
    });

    user
        .get("windows")
        .get(mainAppStoreUniqueID)
        .get("imageAppData")
        .get("texts")
        .get(uniqueID)
        .get("textStoreData")
        .get("blocks")
        .map()
        .get('data')
        .once(data=>{
          // console.log('printing blocks aftger saveToGunDB function:');
          // console.log(data);
        })
  };

  onMount(() => {
    console.log("onMount");
    initializeEditor();
  });

  afterUpdate(() => {
    // console.log("afterUpdate");
    const blocks = get(textStore).blocks || [];
    if (isEditorReady) {
      // updateEditorContent();
    } else if (Array.isArray(blocks) && blocks.length > 0 && typeof blocks[0] === "object") {
      initializeEditor();
    }
  });

  onDestroy(() => {
    // console.log("onDestroy");
    destroyEditor();
  });
</script>

<div bind:this={editorContainer} class="editor-container"></div>

<style>
  .editor-container {
    width: 100%;
    height: 100%;
  }

  .codex-editor__plus {
    left: 0;
    right: auto;
  }
</style>
