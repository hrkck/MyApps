import { writable } from 'svelte/store';

const visible = writable(false);
const message = writable("Are you sure?");
let resolveConfirm;

export function customConfirm(msg = "Are you sure?") {
  message.set(msg);
  visible.set(true);

  return new Promise((resolve) => {
    resolveConfirm = resolve;
  });
}

export function handleConfirmResponse(response) {
  visible.set(false);
  resolveConfirm(response);
}

export { visible, message };
