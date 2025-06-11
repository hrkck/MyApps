// applicationsList.js

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
  selected: false,
  zIndex: 201,
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
  zIndex: 101,
  isActiveDraggable: false,
  isActive: false,
  selected: false,
};

// Applications:
export const applications = [
  // { id: 1, title: "Text App", name: 'Hello World', content: 'Hello, World!'},
  {
    id: 1,
    name: "frame",
    title: "Frame Window",
    component: () => import("../views/Apps/Frame.svelte"),
    ...FrameProperties,
  },
  {
    id: 2,
    name: "linkApp",
    title: "Link App",
    component: () => import("../views/Apps/LinkApp.svelte"),
    ...AppProperties,
  },
  {
    id: 3,
    name: "textEditor",
    title: "Text Editor App",
    component: () => import("../views/Apps/TextEditor.svelte"),
    ...AppProperties,
  },
  {
    id: 4,
    name: "imageReferenceApp",
    title: "Image Reference Board",
    component: () => import("../views/Apps/ImageApp.svelte"),
    ...AppProperties,
  },
  {
    id: 5,
    name: "exampleApp",
    title: "Example App",
    component: () => import("../views/Apps/ExampleApp.svelte"),
    ...AppProperties,
  },
  {
    id: 6, 
    name: "farketmezApp",
    title: "Farketmez",
    component: () => import("../views/Apps/Farketmez.svelte"),
    ...AppProperties,
  },
  {
    id: 7, 
    name: "emptyApp",
    title: "Empty App",
    component: () => import("../views/Apps/EmptyApp.svelte"),
    ...AppProperties,
  },
  // ... add other applications;
];

const linkAppWidth = 80;
const linkAppHeight = 80;
const LinkAppData = {
  id: 2,
  component: () => import("../views/Apps/LinkApp.svelte"),
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
