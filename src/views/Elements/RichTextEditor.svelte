<script>
  import { onMount, afterUpdate, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import Quill from "quill";
  import "quill/dist/quill.snow.css";

  export let textStore;
  export let uniqueID;

  let editor;
  let editorContainer;

  onMount(() => {
    editor = new Quill(editorContainer, {
      theme: "snow",
    });

    // Initialize editor content
    editor.setText(get(textStore).text || "");

    // Update store when editor content changes
    editor.on("text-change", () => {
      textStore.update((store) => {
        store.text = editor.root.innerHTML;
        return store;
      });
    });
  });

  afterUpdate(() => {
    const textContent = get(textStore).text;
    if (textContent && editor.root.innerHTML !== textContent) {
      editor.root.innerHTML = textContent;
    }
  });

  onDestroy(() => {
    if (editor) {
      editor.off("text-change");
      editor = null;
    }
  });
</script>

<div bind:this={editorContainer} class="editor-container"></div>

<style>
  .editor-container {
    height: 100%;
  }
</style>
