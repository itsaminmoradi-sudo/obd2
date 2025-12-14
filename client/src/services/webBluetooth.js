class WebBluetoothService {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
  }

  async requestDevice(filters = {}) {
    // Implementation will be added
  }

  async connect() {
    // Implementation will be added
  }

  async disconnect() {
    // Implementation will be added
  }

  async sendData(data) {
    // Implementation will be added
  }

  async receiveData() {
    // Implementation will be added
  }
}

export default new WebBluetoothService();
