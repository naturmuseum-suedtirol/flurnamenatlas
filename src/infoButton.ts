import L from 'leaflet';

export type InfoButtonOptions = L.ControlOptions & {
  title: string;
  html: string;
  linkTitle?: string;
};

export class InfoButton extends L.Control {
  declare options: InfoButtonOptions;
  private shown = false;
  private container!: HTMLElement;
  private backdrop!: HTMLElement;
  private window!: HTMLElement;
  private map!: L.Map;

  constructor(options: InfoButtonOptions) {
    super(options);
  }

  onAdd(map: L.Map): HTMLElement {
    this.map = map;
    const bar = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    const link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-info-button', bar);
    link.href = '#';
    link.title = this.options.linkTitle ?? 'Info';
    link.textContent = '?';
    L.DomEvent.on(link, 'click', (e) => {
      L.DomEvent.preventDefault(e);
      this.toggle();
    });

    this.container = L.DomUtil.create('div', 'leaflet-infoWindow-container', map.getContainer());
    this.backdrop = L.DomUtil.create('div', 'leaflet-infoWindow-black', this.container);
    this.window = L.DomUtil.create('div', 'leaflet-infoWindow', this.container);
    L.DomUtil.create('div', 'leaflet-title', this.window).innerHTML = this.options.title;
    L.DomUtil.create('div', 'leaflet-content', this.window).innerHTML = this.options.html;

    L.DomEvent.on(this.container, 'click', () => this.toggle());
    L.DomEvent.disableClickPropagation(this.window);
    L.DomEvent.disableScrollPropagation(this.window);
    return bar;
  }

  private toggle(): void {
    this.shown = !this.shown;
    const map = this.map;
    const handlers = [map.dragging, map.touchZoom, map.doubleClickZoom, map.scrollWheelZoom];

    if (this.shown) {
      this.container.style.display = 'block';
      this.backdrop.style.animation = 'showInfoContainer 0.2s';
      this.backdrop.style.opacity = '1';
      this.window.style.animation = 'showInfo 0.5s';
      this.window.style.top = '10%';
      handlers.forEach((h) => h.disable());
    } else {
      this.backdrop.style.animation = 'hideInfoContainer 0.2s';
      this.backdrop.style.opacity = '0';
      this.window.style.animation = 'hideInfo 0.5s';
      this.window.style.top = '-100%';
      setTimeout(() => {
        if (!this.shown) this.container.style.display = 'none';
      }, 500);
      handlers.forEach((h) => h.enable());
    }
  }
}
