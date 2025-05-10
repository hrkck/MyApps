import "./app.css";
import App from "./App.svelte";
import { mount } from "svelte";

console.log("MyApps.");
console.log('version: 0.0.10');

const app = mount(App, {
  target: document.body,
});

if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
  addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((reg) => {
        console.log("Service worker registered.", reg);
      })
      .catch((err) => console.log(`Error: ${err}`));
  });
} else {
  console.log("No service worker registration.");
}

export default app;
