// No storage interface needed for this application
// All data is handled in real-time via WebSocket
// Token launches are processed directly without persistence

export interface IStorage {
  // Empty interface - no data persistence required
}

export class MemStorage implements IStorage {
  constructor() {
    // No storage needed
  }
}

export const storage = new MemStorage();
