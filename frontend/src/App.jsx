import { useState } from 'react'
import axios from 'axios'

function App() {
  const [status, setStatus] = useState('Idle')
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    setStatus('Sending request...')
    console.log('Frontend (React): Button clicked')
    
    try {
      const response = await axios.post('http://localhost:5000/api/trigger')
      console.log('Frontend (React): Response received:', response.data)
      setStatus(`Success: ${response.data.ai_service_response.message}`)
    } catch (error) {
      console.error('Frontend (React): Error:', error)
      setStatus('Error: Could not connect to backend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 backdrop-blur-sm">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Full-Stack Bridge
        </h1>
        
        <div className="space-y-6">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Current Status</p>
            <p className={`font-mono text-lg ${loading ? 'text-yellow-400 animate-pulse' : 'text-green-400'}`}>
              {status}
            </p>
          </div>

          <button
            onClick={handleClick}
            disabled={loading}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform active:scale-95 shadow-lg
              ${loading 
                ? 'bg-slate-700 cursor-not-allowed border-slate-600' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:shadow-blue-500/25 border-t border-white/10'
              }`}
          >
            {loading ? 'Processing...' : 'Click Me'}
          </button>

          <div className="grid grid-cols-1 gap-4 text-xs">
            <div className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg border border-slate-600/30">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span>Frontend: React + Tailwind</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg border border-slate-600/30">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>Backend: Node + Express</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg border border-slate-600/30">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span>AI Service: Python + FastAPI</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-slate-500 text-sm">
        Check terminal windows for print statements
      </p>
    </div>
  )
}

export default App
