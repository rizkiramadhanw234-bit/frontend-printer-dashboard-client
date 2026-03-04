const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:15002/ws/dashboard'

class WebSocketService {
  constructor() {
    this.wsUrl = WS_URL
    this.socket = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 5000
    this.subscriptions = new Map()
    this.isConnecting = false
    this.heartbeatInterval = null
  }

  connect() {
    if (this.isConnecting) return
    if (this.socket?.readyState === WebSocket.OPEN) return

    this.isConnecting = true

    try {
      this.socket = new WebSocket(this.wsUrl)

      this.socket.onopen = () => {
        console.log('✅ WebSocket connected')
        this.reconnectAttempts = 0
        this.isConnecting = false
        this.startHeartbeat()
        this.notifySubscribers('connection', { type: 'connected' })
      }

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.event === 'printer_status_update' || data.event === 'printer_ink_update') {
            this.notifySubscribers('printers', data)
          } else if (data.event === 'agent_connected' || data.event === 'agent_disconnected') {
            this.notifySubscribers('agent', data)
          } else {
            this.notifySubscribers('broadcast', data)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        this.isConnecting = false
        this.notifySubscribers('connection', { type: 'error', error })
      }

      this.socket.onclose = (event) => {
        console.log('🔌 WebSocket disconnected')
        this.isConnecting = false
        this.stopHeartbeat()
        this.notifySubscribers('connection', { type: 'disconnected' })

        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts)
          setTimeout(() => {
            this.reconnectAttempts++
            this.connect()
          }, delay)
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      this.isConnecting = false
    }
  }

  disconnect() {
    if (this.socket) {
      this.stopHeartbeat()
      this.socket.close(1000, 'Client disconnected')
      this.socket = null
    }
  }

  subscribe(channel, callback) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, [])
    }
    this.subscriptions.get(channel).push(callback)

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.connect()
    }

    return () => this.unsubscribe(channel, callback)
  }

  unsubscribe(channel, callback) {
    if (this.subscriptions.has(channel)) {
      const callbacks = this.subscriptions.get(channel)
      const index = callbacks.indexOf(callback)
      if (index > -1) callbacks.splice(index, 1)
    }
  }

  notifySubscribers(channel, data) {
    const callbacks = this.subscriptions.get(channel) || []
    callbacks.forEach(cb => {
      try { cb(data) } catch (error) { console.error('Subscriber error:', error) }
    })
  }

  send(data) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(typeof data === 'string' ? data : JSON.stringify(data))
        return true
      } catch (error) {
        console.error('Failed to send:', error)
        return false
      }
    }
    return false
  }

  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() })
      }
    }, 30000)
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  subscribeToPrinters(callback) {
    return this.subscribe('printers', callback)
  }

  subscribeToAgent(callback) {
    return this.subscribe('agent', callback)
  }

  subscribeToConnection(callback) {
    return this.subscribe('connection', callback)
  }
}

export default new WebSocketService()