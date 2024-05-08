import "./app.css";
import App from "./App.svelte";

const app = new App({
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
