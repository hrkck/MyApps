<script lang="ts">
    export let message = "Are you sure?";
    export let visible = false;
    export let onConfirm: (response: boolean) => void;  // Accepts callback for confirmation
    export let onCancel: () => void;  // Accepts callback for cancellation
  </script>
  
  {#if visible}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
        <p class="mb-4 text-lg">{message}</p>
        <div class="flex justify-end space-x-2">
          <button on:click={onCancel} class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
          <button on:click={() => onConfirm(true)} class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">OK</button>
        </div>
      </div>
    </div>
  {/if}
  