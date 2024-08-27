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

  export let textStore;
  // export let uniqueID;
  // export let mainAppStoreUniqueID;
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

    if (!Array.isArray(blocks) || blocks.length === 0 || typeof blocks[0] !== "object") {
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
        isEditorReady = true;
      },
      onChange: async () => {
        if (editor) {
          try {
            const content = await editor.save();
            if (validateBlocks(content.blocks)) {
              textStore.update((store) => {
                store.blocks = content.blocks;
                return store;
              });
              dispatch("contentChanged", content); // Dispatch event to parent
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
      try {
        const currentContent = await editor.save();
        if (JSON.stringify(currentContent.blocks) !== JSON.stringify(blocks)) {
          editor.render({ blocks });
        }
      } catch (error) {
        console.error("Error updating content:", error);
      }
    }
  };

  const destroyEditor = () => {
    if (editor) {
      editor.destroy();
      editor = null;
    }
  };

  const validateBlocks = (blocks) => {
    // Basic validation for blocks structure
    return (
      Array.isArray(blocks) &&
      blocks.every((block) => {
        if (!block.type || typeof block.type !== "string") {
          return false;
        }

        if (!block.data || typeof block.data !== "object") {
          return false;
        }

        switch (block.type) {
          case "paragraph":
          case "header":
          case "quote":
          case "code":
          case "checklist":
          case "list":
          case "inlineCode":
            // For text-based blocks, ensure the data contains a string text property
            return typeof block.data.text === "string";

          case "image":
            // For image blocks, ensure the necessary properties exist
            return (
              typeof block.data.file === "object" &&
              typeof block.data.file.url === "string" &&
              typeof block.data.withBorder === "boolean" &&
              typeof block.data.stretched === "boolean" &&
              typeof block.data.withBackground === "boolean"
            );

          // Add more cases here for other block types you support
          default:
            // If the block type is unrecognized, you might want to reject it
            console.warn(`Unknown block type: ${block.type}`);
            return false;
        }
      })
    );
  };

  onMount(() => {
    initializeEditor();
  });

  afterUpdate(() => {
    const blocks = get(textStore).blocks || [];
    if (isEditorReady) {
      // updateEditorContent();
    } else if (Array.isArray(blocks) && blocks.length > 0 && typeof blocks[0] === "object") {
      initializeEditor();
    }
  });

  onDestroy(() => {
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
