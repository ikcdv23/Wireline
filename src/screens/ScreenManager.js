export class ScreenManager {
  constructor () {
    this.current = null;
  }

  show (screen) {
    if (this.current) {
      this.current.unmount ();
    }
    this.current = screen;
    screen.mount ();
  }
}
