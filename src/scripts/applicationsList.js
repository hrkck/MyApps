// applicationsList.js
import ImageApp from "../views/Apps/ImageApp.svelte";
import LinkApp from "../views/Apps/LinkApp.svelte";
import TextEditor from "../views/Apps/TextEditor.svelte";
import Frame from "../views/Apps/Frame.svelte";
import ExampleApp from "../views/Apps/ExampleApp.svelte";

const AppProperties = {
  windowType: "apps",
  boxShadow: true,
  hideOverflow: true,
  dragEventTarget: "node",
  useWindow: false,
  scalable: false,
  resizable: true,
  keepRatio: false,
  showGrabbers: true,
  hideHeaderResize: false,
  isActiveDraggable: false,
  scale: 1,
  isActive: false,
  zIndex: 11,
};

const FrameProperties = {
  boxShadow: false,
  hideOverflow: false,
  dragEventTarget: "node",
  useWindow: false,
  scalable: false,
  resizable: false,
  keepRatio: false,
  showGrabbers: false,
  hideHeaderResize: true,
  scale: 1,
  isInsideFrameID: "-1",
  zIndex: 2,
  isActiveDraggable: false,
  isActive: false,
};
// Applications:
export const applications = [
  // { id: 1, title: "Text App", name: 'Hello World', content: 'Hello, World!'},
  {
    id: 1,
    name: "frame",
    title: "Frame Window",
    component: Frame,
    ...FrameProperties,
  },
  {
    id: 2,
    name: "linkApp",
    title: "Link App",
    component: LinkApp,
    ...AppProperties,
  },
  {
    id: 3,
    name: "textEditor",
    title: "Text Editor App",
    component: TextEditor,
    ...AppProperties,
  },
  {
    id: 4,
    name: "imageReferenceApp",
    title: "Image Reference Board",
    component: ImageApp,
    ...AppProperties,
  },
  // {
  //   id: 4,
  //   name: "exampleApp",
  //   title: "Example App",
  //   component: ExampleApp,
  //   ...AppProperties,
  // },
  // ... add other applications;
];

const linkAppWidth = 80;
const linkAppHeight = 80;
const LinkAppData = {
  id: 2,
  component: LinkApp,
  name: "linkApp",
  title: "Link App",
  ...AppProperties,
  width: linkAppWidth,
  height: linkAppHeight,
};

export const applicationGroups = [
  {
    id: 1,
    groupTitle: "Startup Links",
    groupName: "Startup Links",
    contents: [
      {
        ...LinkAppData,
        linkUrl: "https://google.com",
      },
      {
        ...LinkAppData,
        linkUrl: "https://web.telegram.org",
      },
      {
        ...LinkAppData,
        linkUrl: "https://web.whatsapp.com",
      },
      {
        ...LinkAppData,
        linkUrl: "https://youtube.com",
      },
      {
        ...LinkAppData,
        linkUrl: "https://translate.google.com",
      },
      {
        ...LinkAppData,
        linkUrl: "https://earth.google.com",
      },
      {
        ...LinkAppData,
        linkUrl: "https://blender.org",
      },
      {
        ...LinkAppData,
        linkUrl: "https://chat.openai.com",
      },
    ],
  },
];
