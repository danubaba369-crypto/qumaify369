'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Silently handle error for production
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 glass-panel rounded-2xl border border-white/5 text-center">
          <h2 className="text-2xl font-black uppercase tracking-widest text-[#ff12b1] mb-4">System Anomaly Detected</h2>
          <p className="text-gray-400 mb-8 max-w-md">The engine encountered an unexpected state. Please attempt a manual reboot.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false })
              window.location.reload()
            }}
            className="px-8 py-3 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95"
          >
            Retry / Reboot
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
