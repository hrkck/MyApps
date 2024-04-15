import './app.css'
import App from './App.svelte'

const app = new App({
  target: document.body,
})


//     Register the Service Worker in Your Main JavaScript File:
// if ("serviceWorker" in navigator) {
//   addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("./service-worker.js")
//       .then((reg) => {
//         console.log("Service worker registeredd.", reg);
//       })
//       .catch((err) => console.log(`error: ${err}`));
//   });
// }
console.log("no service worker registration");

export default app
