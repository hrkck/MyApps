export default class ImageResize {
    constructor(quill) {
      this.quill = quill;
      this.handleClick = this.handleClick.bind(this);
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleMouseUp = this.handleMouseUp.bind(this);
      this.quill.root.addEventListener('click', this.handleClick, false);
    }
  
    handleClick(evt) {
      if (evt.target.tagName === 'IMG') {
        this.img = evt.target;
        this.showResizeHandles();
        document.addEventListener('mousemove', this.handleMouseMove, false);
        document.addEventListener('mouseup', this.handleMouseUp, false);
      } else {
        this.hideResizeHandles();
      }
    }
  
    showResizeHandles() {
      const rect = this.img.getBoundingClientRect();
      this.resizeHandles = ['nw', 'ne', 'sw', 'se'].map(corner => {
        const handle = document.createElement('div');
        handle.style.position = 'absolute';
        handle.style.width = '10px';
        handle.style.height = '10px';
        handle.style.backgroundColor = 'blue';
        handle.style.zIndex = 10;
        handle.style.cursor = `${corner}-resize`;
        handle.setAttribute('data-corner', corner);
        handle.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
        document.body.appendChild(handle);
        return handle;
      });
      this.positionHandles(rect);
    }
  
    positionHandles(rect) {
      const { top, left, width, height } = rect;
      const positions = {
        nw: { top: top - 5, left: left - 5 },
        ne: { top: top - 5, left: left + width - 5 },
        sw: { top: top + height - 5, left: left - 5 },
        se: { top: top + height - 5, left: left + width - 5 }
      };
      this.resizeHandles.forEach(handle => {
        const corner = handle.getAttribute('data-corner');
        handle.style.top = `${positions[corner].top}px`;
        handle.style.left = `${positions[corner].left}px`;
      });
    }
  
    handleMouseDown(evt) {
      this.corner = evt.target.getAttribute('data-corner');
      this.startX = evt.clientX;
      this.startY = evt.clientY;
      this.startWidth = this.img.width;
      this.startHeight = this.img.height;
    }
  
    handleMouseMove(evt) {
      if (!this.corner) return;
      const deltaX = evt.clientX - this.startX;
      const deltaY = evt.clientY - this.startY;
      if (this.corner.includes('e')) this.img.width = this.startWidth + deltaX;
      if (this.corner.includes('s')) this.img.height = this.startHeight + deltaY;
      if (this.corner.includes('w')) this.img.width = this.startWidth - deltaX;
      if (this.corner.includes('n')) this.img.height = this.startHeight - deltaY;
      this.positionHandles(this.img.getBoundingClientRect());
    }
  
    handleMouseUp() {
      this.corner = null;
      document.removeEventListener('mousemove', this.handleMouseMove, false);
      document.removeEventListener('mouseup', this.handleMouseUp, false);
    }
  
    hideResizeHandles() {
      if (this.resizeHandles) {
        this.resizeHandles.forEach(handle => handle.remove());
        this.resizeHandles = null;
      }
    }
  }
  