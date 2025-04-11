import SteeringWheel from "./components/SteeringWheel"
import Throttle from "./components/Throttle"
import Brake from "./components/Brake"
import { useState } from "react"

function App() {
  const [layout, setLayout] = useState<"single" | "all">("single")
  const [activeComponent, setActiveComponent] = useState<string>("wheel")
  
  return (
    <div className="w-full h-full">
      {/* Navigation and controls */}
      <div className="absolute top-0 left-0 z-10 flex gap-2 p-2 bg-black/40 rounded-br shadow-lg">
        {/* View mode toggle */}
        <div className="flex items-center mr-4 border-r pr-4 border-gray-600">
          <button 
            onClick={() => setLayout("single")}
            className={`px-3 py-1 rounded ${layout === "single" ? "bg-green-600" : "bg-gray-700"}`}
            title="Show one component at a time"
          >
            Single
          </button>
          <button 
            onClick={() => setLayout("all")}
            className={`px-3 py-1 ml-2 rounded ${layout === "all" ? "bg-green-600" : "bg-gray-700"}`}
            title="Show all components"
          >
            All
          </button>
        </div>
        
        {/* Component selection (only active in single mode) */}
        <button 
          onClick={() => setActiveComponent("wheel")}
          className={`px-3 py-1 rounded ${activeComponent === "wheel" ? "bg-blue-600" : "bg-gray-700"}`}
          disabled={layout === "all"}
        >
          Wheel
        </button>
        <button 
          onClick={() => setActiveComponent("throttle")}
          className={`px-3 py-1 rounded ${activeComponent === "throttle" ? "bg-blue-600" : "bg-gray-700"}`}
          disabled={layout === "all"}
        >
          Throttle
        </button>
        <button 
          onClick={() => setActiveComponent("brake")}
          className={`px-3 py-1 rounded ${activeComponent === "brake" ? "bg-blue-600" : "bg-gray-700"}`}
          disabled={layout === "all"}
        >
          Brake
        </button>
      </div>
      
      {/* Main content */}
      {layout === "single" ? (
        // Single component view
        <div className="w-full h-full">
          {activeComponent === "wheel" && <SteeringWheel />}
          {activeComponent === "throttle" && <Throttle />}
          {activeComponent === "brake" && <Brake />}
        </div>
      ) : (
        // All components view in a grid
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2 p-2">
          <div className="col-span-2 row-span-1 bg-transparent rounded overflow-hidden shadow-lg">
            <SteeringWheel />
          </div>
          <div className="col-span-1 row-span-1 bg-transparent rounded overflow-hidden shadow-lg">
            <Throttle />
          </div>
          <div className="col-span-1 row-span-1 bg-transparent rounded overflow-hidden shadow-lg">
            <Brake />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
